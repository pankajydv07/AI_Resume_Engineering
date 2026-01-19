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
import { ClerkAuthGuard } from '../auth/guards/clerk-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { ApiKeysService } from './api-keys.service';
import { StoreApiKeyDto, ApiKeyResponseDto, ValidateApiKeyResponseDto } from './dto/api-key.dto';

@Controller('api-keys')
@UseGuards(ClerkAuthGuard)
export class ApiKeysController {
  constructor(private readonly apiKeysService: ApiKeysService) {}

  @Post()
  async storeApiKey(
    @CurrentUser() userId: string,
    @Body() dto: StoreApiKeyDto,
  ): Promise<ApiKeyResponseDto> {
    return this.apiKeysService.storeApiKey(userId, dto);
  }

  @Get()
  async listUserApiKeys(@CurrentUser() userId: string): Promise<ApiKeyResponseDto[]> {
    return this.apiKeysService.listUserApiKeys(userId);
  }

  @Post(':id/validate')
  async validateApiKey(
    @CurrentUser() userId: string,
    @Param('id') id: string,
  ): Promise<ValidateApiKeyResponseDto> {
    return this.apiKeysService.validateApiKey(userId, id);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  async deleteApiKey(
    @CurrentUser() userId: string,
    @Param('id') id: string,
  ): Promise<{ success: boolean }> {
    await this.apiKeysService.deleteApiKey(userId, id);
    return { success: true };
  }
}
