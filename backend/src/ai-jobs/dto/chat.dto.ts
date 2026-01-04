import { IsArray, IsString, IsOptional, IsUUID } from 'class-validator';

/**
 * DTO for chat message
 */
export class ChatMessageDto {
  @IsString()
  role: 'user' | 'assistant' | 'system';

  @IsString()
  content: string;
}

/**
 * DTO for sending chat request
 */
export class SendChatDto {
  @IsUUID()
  projectId: string;

  @IsString()
  message: string;

  @IsString()
  @IsOptional()
  resumeContext?: string; // Current resume content for context

  @IsString()
  @IsOptional()
  jdContext?: string; // Job description for context

  @IsArray()
  @IsOptional()
  conversationHistory?: ChatMessageDto[]; // Previous messages for context
}

/**
 * Response DTO for chat
 */
export class ChatResponseDto {
  message: string;
  conversationId?: string;
}
