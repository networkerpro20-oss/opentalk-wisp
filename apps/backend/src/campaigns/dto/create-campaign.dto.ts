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

  @ApiPropertyOptional({ description: 'AI brief to generate campaign message' })
  @IsOptional()
  @IsString()
  aiBrief?: string;

  @ApiPropertyOptional({ description: 'AI generated text' })
  @IsOptional()
  @IsString()
  aiGeneratedText?: string;

  @ApiPropertyOptional({ description: 'Message type: TEXT, AUDIO, IMAGE, DOCUMENT' })
  @IsOptional()
  @IsString()
  campaignMessageType?: string;

  @ApiPropertyOptional({ description: 'Audio URL for TTS campaigns' })
  @IsOptional()
  @IsString()
  audioUrl?: string;

  @ApiPropertyOptional({ description: 'TTS voice: alloy, echo, fable, onyx, nova, shimmer' })
  @IsOptional()
  @IsString()
  ttsVoice?: string;

  @ApiPropertyOptional({ description: 'A/B test variants [{id, message, weight}]' })
  @IsOptional()
  variants?: any;
}
