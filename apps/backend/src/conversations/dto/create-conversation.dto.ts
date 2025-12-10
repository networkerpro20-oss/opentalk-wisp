import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsEnum,
  IsOptional,
  IsUUID,
} from 'class-validator';
import { ConversationStatus, Channel } from '@prisma/client';

export class CreateConversationDto {
  @ApiProperty({ description: 'Contact ID' })
  @IsUUID()
  contactId: string;

  @ApiPropertyOptional({
    description: 'Conversation status',
    enum: ConversationStatus,
    default: ConversationStatus.OPEN,
  })
  @IsOptional()
  @IsEnum(ConversationStatus)
  status?: ConversationStatus;

  @ApiPropertyOptional({
    description: 'Communication channel',
    enum: Channel,
    default: Channel.WHATSAPP,
  })
  @IsOptional()
  @IsEnum(Channel)
  channel?: Channel;

  @ApiPropertyOptional({ description: 'Assigned user ID' })
  @IsOptional()
  @IsUUID()
  assignedToId?: string;

  @ApiPropertyOptional({ description: 'WhatsApp instance ID' })
  @IsOptional()
  @IsUUID()
  whatsappInstanceId?: string;
}
