import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { ClerkAuthGuard } from '../auth/guards/clerk-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { ApiKeysService } from './api-keys.service';
import { StoreApiKeyDto, ApiKeyResponseDto, ValidateApiKeyResponseDto } from './dto/api-key.dto';

/**
 * API Keys Controller
 * 
 * Handles user API key management for AI providers
 * 
 * SECURITY HARDENING:
 * - Strict rate limiting on all endpoints (sensitive operations)
 * - API keys are encrypted before storage
 * - Raw API keys are never returned in responses
 * - Validation prevents storing invalid keys
 */
@Controller('api-keys')
@UseGuards(ClerkAuthGuard)
export class ApiKeysController {
  constructor(private readonly apiKeysService: ApiKeysService) {}

  /**
   * Store a new API key
   * 
   * SECURITY: 
   * - Rate limited (5 requests/minute) - prevents brute force
   * - Key is validated before storage
   * - Key is encrypted in database
   */
  @Post()
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  async storeApiKey(
    @CurrentUser() userId: string,
    @Body() dto: StoreApiKeyDto,
  ): Promise<ApiKeyResponseDto> {
    return this.apiKeysService.storeApiKey(userId, dto);
  }

  /**
   * List user's API keys
   * 
   * SECURITY: Raw API keys are never returned
   */
  @Get()
  async listUserApiKeys(@CurrentUser() userId: string): Promise<ApiKeyResponseDto[]> {
    return this.apiKeysService.listUserApiKeys(userId);
  }

  /**
   * Validate an existing API key
   * 
   * SECURITY:
   * - Rate limited (5 requests/minute) - prevents oracle attacks
   * - Tests key against provider API
   */
  @Post(':id/validate')
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  async validateApiKey(
    @CurrentUser() userId: string,
    @Param('id') id: string,
  ): Promise<ValidateApiKeyResponseDto> {
    return this.apiKeysService.validateApiKey(userId, id);
  }

  /**
   * Delete an API key
   * 
   * SECURITY: Rate limited to prevent rapid deletion attempts
   */
  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  async deleteApiKey(
    @CurrentUser() userId: string,
    @Param('id') id: string,
  ): Promise<{ success: boolean }> {
    await this.apiKeysService.deleteApiKey(userId, id);
    return { success: true };
  }
}
