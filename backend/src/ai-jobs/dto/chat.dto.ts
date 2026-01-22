import { IsArray, IsString, IsOptional, IsUUID, IsEnum, MaxLength, ArrayMaxSize, ValidateNested } from 'class-validator';
import { Transform, Type } from 'class-transformer';

/**
 * DTO for chat message
 * 
 * SECURITY VALIDATION:
 * - Role must be from allowed enum
 * - Content has length limit
 */
export class ChatMessageDto {
  @IsEnum(['user', 'assistant', 'system'], { 
    message: 'Role must be user, assistant, or system' 
  })
  role: 'user' | 'assistant' | 'system';

  @IsString({ message: 'Content must be a string' })
  @MaxLength(50000, { message: 'Message content must not exceed 50000 characters' })
  content: string;
}

/**
 * DTO for sending chat request
 * 
 * SECURITY VALIDATION:
 * - Project ID must be valid UUID
 * - Message and context fields have length limits
 * - Conversation history limited to prevent token abuse
 */
export class SendChatDto {
  @IsUUID('4', { message: 'Project ID must be a valid UUID' })
  projectId: string;

  @IsString({ message: 'Message must be a string' })
  @MaxLength(10000, { message: 'Message must not exceed 10000 characters' })
  @Transform(({ value }) => typeof value === 'string' ? value.trim() : value)
  message: string;

  @IsString({ message: 'Resume context must be a string' })
  @IsOptional()
  @MaxLength(100000, { message: 'Resume context must not exceed 100000 characters' })
  resumeContext?: string; // Current resume content for context

  @IsString({ message: 'JD context must be a string' })
  @IsOptional()
  @MaxLength(50000, { message: 'JD context must not exceed 50000 characters' })
  jdContext?: string; // Job description for context

  @IsArray({ message: 'Conversation history must be an array' })
  @IsOptional()
  @ArrayMaxSize(50, { message: 'Conversation history cannot exceed 50 messages' })
  @ValidateNested({ each: true })
  @Type(() => ChatMessageDto)
  conversationHistory?: ChatMessageDto[]; // Previous messages for context
}

/**
 * Response DTO for chat
 */
export class ChatResponseDto {
  message: string;
  conversationId?: string;
}
