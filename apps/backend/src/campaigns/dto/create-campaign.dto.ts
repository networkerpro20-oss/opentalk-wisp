import {
  IsString,
  IsOptional,
  IsObject,
  IsDateString,
  IsBoolean,
  IsEnum,
  IsNumber,
  Min,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum CampaignStatus {
  DRAFT = 'DRAFT',
  SCHEDULED = 'SCHEDULED',
  RUNNING = 'RUNNING',
  PAUSED = 'PAUSED',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

export class CreateCampaignDto {
  @ApiProperty({ description: 'Campaign name' })
  @IsString()
  name: string;

  @ApiPropertyOptional({ description: 'Campaign description' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ description: 'Target segment filters (JSON)' })
  @IsObject()
  targetSegment: any;

  @ApiProperty({ description: 'Message template with variables' })
  @IsString()
  messageTemplate: string;

  @ApiPropertyOptional({ description: 'Media URL (image, video, document)' })
  @IsOptional()
  @IsString()
  mediaUrl?: string;

  @ApiPropertyOptional({ description: 'Schedule date/time' })
  @IsOptional()
  @IsDateString()
  scheduledAt?: string;

  @ApiPropertyOptional({ description: 'Messages per minute (rate limit)' })
  @IsOptional()
  @IsNumber()
  @Min(1)
  messagesPerMinute?: number;

  @ApiPropertyOptional({ description: 'Auto-start when scheduled time arrives' })
  @IsOptional()
  @IsBoolean()
  autoStart?: boolean;
}
