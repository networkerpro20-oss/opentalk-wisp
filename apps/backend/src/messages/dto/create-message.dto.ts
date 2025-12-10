import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsEnum,
  IsOptional,
  IsUUID,
} from 'class-validator';
import { MessageType, MessageDirection } from '@prisma/client';

export class CreateMessageDto {
  @ApiProperty({ description: 'Message content' })
  @IsString()
  content: string;

  @ApiProperty({
    description: 'Message type',
    enum: MessageType,
    default: MessageType.TEXT,
  })
  @IsEnum(MessageType)
  type: MessageType;

  @ApiPropertyOptional({ description: 'Media URL for images, videos, etc.' })
  @IsOptional()
  @IsString()
  mediaUrl?: string;

  @ApiProperty({
    description: 'Message direction',
    enum: MessageDirection,
  })
  @IsEnum(MessageDirection)
  direction: MessageDirection;

  @ApiProperty({ description: 'Conversation ID' })
  @IsUUID()
  conversationId: string;

  @ApiProperty({ description: 'Contact ID' })
  @IsUUID()
  contactId: string;

  @ApiPropertyOptional({ description: 'WhatsApp instance ID' })
  @IsOptional()
  @IsUUID()
  whatsappInstanceId?: string;

  @ApiPropertyOptional({ description: 'WhatsApp message ID' })
  @IsOptional()
  @IsString()
  whatsappMessageId?: string;
}
