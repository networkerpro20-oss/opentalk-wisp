import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsEnum, IsOptional, IsUUID, ValidateIf } from 'class-validator';
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

  @ApiPropertyOptional({ enum: ConversationDisposition, nullable: true })
  @IsOptional()
  @ValidateIf((o) => o.disposition !== null)
  @IsEnum(ConversationDisposition)
  disposition?: ConversationDisposition | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  dispositionNote?: string;
}
