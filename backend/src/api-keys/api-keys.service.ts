import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AIModelProvider } from '@prisma/client';
import { StoreApiKeyDto, ApiKeyResponseDto, ValidateApiKeyResponseDto } from './dto/api-key.dto';
import ModelClient, { isUnexpected } from '@azure-rest/ai-inference';
import { AzureKeyCredential } from '@azure/core-auth';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { encrypt, decrypt, maskSensitiveString } from '../common/utils/encryption.util';

/**
 * API Keys Service
 * 
 * SECURITY HARDENING:
 * - API keys are encrypted before storage using AES-256-GCM
 * - Keys are decrypted only when needed for validation/use
 * - Raw keys are NEVER logged or returned in responses
 * - Validation prevents storing invalid keys
 */
@Injectable()
export class ApiKeysService {
  constructor(private prisma: PrismaService) {}

  async storeApiKey(userId: string, dto: StoreApiKeyDto): Promise<ApiKeyResponseDto> {
    // Validate required fields based on provider
    if (dto.provider === AIModelProvider.AZURE_OPENAI && !dto.endpoint) {
      throw new BadRequestException('endpoint is required for AZURE_OPENAI provider');
    }

    // Validate the API key before storing
    const validation = await this.validateApiKeyCredentials(dto.provider, dto.apiKey, dto.endpoint);
    
    if (!validation.isValid) {
      throw new BadRequestException(`Invalid API key: ${validation.validationError}`);
    }

    // Check if key already exists for this provider
    const existing = await this.prisma.userAPIKey.findUnique({
      where: {
        userId_provider: {
          userId,
          provider: dto.provider,
        },
      },
    });

    if (existing) {
      throw new ConflictException(`API key for ${dto.provider} already exists. Delete the existing key first.`);
    }

    // SECURITY: Encrypt the API key before storing
    const encryptedApiKey = encrypt(dto.apiKey);
    
    // Log masked key for audit (never log real key)
    console.log(`[ApiKeys] Storing encrypted key for user ${userId}, provider ${dto.provider}, key: ${maskSensitiveString(dto.apiKey)}`);

    // Store the encrypted API key
    const apiKey = await this.prisma.userAPIKey.create({
      data: {
        userId,
        provider: dto.provider,
        apiKey: encryptedApiKey, // SECURITY: Encrypted
        endpoint: dto.endpoint,
        isValid: validation.isValid,
        lastValidated: validation.lastValidated,
        validationError: validation.validationError,
      },
    });

    return this.toResponseDto(apiKey);
  }

  async listUserApiKeys(userId: string): Promise<ApiKeyResponseDto[]> {
    const apiKeys = await this.prisma.userAPIKey.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    // SECURITY: Raw API keys are never exposed in list responses
    return apiKeys.map((key) => this.toResponseDto(key));
  }

  async validateApiKey(userId: string, id: string): Promise<ValidateApiKeyResponseDto> {
    const apiKey = await this.prisma.userAPIKey.findUnique({
      where: { id },
    });

    if (!apiKey || apiKey.userId !== userId) {
      throw new NotFoundException('API key not found');
    }

    // SECURITY: Decrypt the API key for validation
    let decryptedApiKey: string;
    try {
      decryptedApiKey = decrypt(apiKey.apiKey);
    } catch (error) {
      console.error(`[ApiKeys] Failed to decrypt API key ${id}:`, error.message);
      return {
        isValid: false,
        validationError: 'Failed to decrypt stored API key. Please delete and re-add.',
        lastValidated: new Date(),
      };
    }

    const validation = await this.validateApiKeyCredentials(
      apiKey.provider,
      decryptedApiKey,
      apiKey.endpoint,
    );

    // Update validation status
    await this.prisma.userAPIKey.update({
      where: { id },
      data: {
        isValid: validation.isValid,
        lastValidated: validation.lastValidated,
        validationError: validation.validationError,
      },
    });

    return validation;
  }

  async deleteApiKey(userId: string, id: string): Promise<void> {
    const apiKey = await this.prisma.userAPIKey.findUnique({
      where: { id },
    });

    if (!apiKey || apiKey.userId !== userId) {
      throw new NotFoundException('API key not found');
    }

    console.log(`[ApiKeys] Deleting API key ${id} for user ${userId}, provider ${apiKey.provider}`);

    await this.prisma.userAPIKey.delete({
      where: { id },
    });
  }

  /**
   * Get user's API key for a provider with decrypted key
   * 
   * SECURITY: This method returns the decrypted key for use in AI calls
   * Should only be called internally by services that need the actual key
   */
  async getUserApiKey(userId: string, provider: AIModelProvider) {
    const apiKey = await this.prisma.userAPIKey.findUnique({
      where: {
        userId_provider: {
          userId,
          provider,
        },
      },
    });

    if (!apiKey) {
      return null;
    }

    // SECURITY: Decrypt the API key for use
    try {
      const decryptedApiKey = decrypt(apiKey.apiKey);
      return {
        ...apiKey,
        apiKey: decryptedApiKey, // Return decrypted key for use
      };
    } catch (error) {
      console.error(`[ApiKeys] Failed to decrypt API key for user ${userId}, provider ${provider}:`, error.message);
      return null;
    }
  }

  private async validateApiKeyCredentials(
    provider: AIModelProvider,
    apiKey: string,
    endpoint?: string,
  ): Promise<ValidateApiKeyResponseDto> {
    const now = new Date();

    if (provider === AIModelProvider.QWEN) {
      // QWEN uses system credentials, user keys not supported
      return {
        isValid: false,
        validationError: 'QWEN provider does not require user API keys',
        lastValidated: now,
      };
    }

    if (provider === AIModelProvider.GEMINI) {
      try {
        // Validate Gemini API key by making a test request
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash-lite' });

        const result = await model.generateContent('test');
        const response = await result.response;
        response.text(); // Will throw if invalid

        return {
          isValid: true,
          validationError: null,
          lastValidated: now,
        };
      } catch (error) {
        return {
          isValid: false,
          validationError: error.message || 'Failed to validate API key',
          lastValidated: now,
        };
      }
    }

    if (provider === AIModelProvider.AZURE_OPENAI) {
      try {
        // Validate Azure OpenAI key by making a test request
        const client = ModelClient(endpoint, new AzureKeyCredential(apiKey));

        const response = await client.path('/chat/completions').post({
          body: {
            messages: [{ role: 'user', content: 'test' }],
            model: 'openai/gpt-5',
            max_completion_tokens: 1,
          } as any,
        });

        if (isUnexpected(response)) {
          return {
            isValid: false,
            validationError: response.body?.error?.message || 'API key validation failed',
            lastValidated: now,
          };
        }

        return {
          isValid: true,
          validationError: null,
          lastValidated: now,
        };
      } catch (error) {
        return {
          isValid: false,
          validationError: error.message || 'Failed to validate API key',
          lastValidated: now,
        };
      }
    }

    return {
      isValid: false,
      validationError: 'Unsupported provider',
      lastValidated: now,
    };
  }

  private toResponseDto(apiKey: any): ApiKeyResponseDto {
    return {
      id: apiKey.id,
      provider: apiKey.provider,
      endpoint: apiKey.endpoint,
      isValid: apiKey.isValid,
      lastValidated: apiKey.lastValidated,
      validationError: apiKey.validationError,
      createdAt: apiKey.createdAt,
    };
  }
}
