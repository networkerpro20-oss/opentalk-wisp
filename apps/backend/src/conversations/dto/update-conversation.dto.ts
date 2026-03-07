import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsEnum, IsOptional, IsUUID } from 'class-validator';
import { ConversationStatus, Channel, ConversationDisposition } from '@prisma/client';

export class UpdateConversationDto {
  @ApiPropertyOptional({ enum: ConversationStatus })
  @IsOptional()
  @IsEnum(ConversationStatus)
  status?: ConversationStatus;

  @ApiPropertyOptional({ enum: Channel })
  @IsOptional()
  @IsEnum(Channel)
  channel?: Channel;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  assignedToId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  whatsappInstanceId?: string;

  @ApiPropertyOptional({ enum: ConversationDisposition })
  @IsOptional()
  @IsEnum(ConversationDisposition)
  disposition?: ConversationDisposition;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  dispositionNote?: string;
}
