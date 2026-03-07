import { IsString, IsOptional, IsArray, IsBoolean, IsNumber, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateWebhookDto {
  @ApiProperty({ description: 'Webhook name' })
  @IsString()
  name: string;

  @ApiProperty({ description: 'URL to send events to' })
  @IsString()
  url: string;

  @ApiPropertyOptional({ description: 'HMAC secret for signature verification' })
  @IsOptional()
  @IsString()
  secret?: string;

  @ApiProperty({ description: 'Events to subscribe to', type: [String] })
  @IsArray()
  events: string[];

  @ApiPropertyOptional({ description: 'Max retry attempts' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  maxRetries?: number;
}

export class UpdateWebhookDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  url?: string;

  @IsOptional()
  @IsString()
  secret?: string;

  @IsOptional()
  @IsArray()
  events?: string[];

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsNumber()
  maxRetries?: number;
}

export const WEBHOOK_EVENTS = [
  'contact.created',
  'contact.updated',
  'conversation.created',
  'message.received',
  'message.sent',
  'deal.created',
  'deal.updated',
  'campaign.completed',
] as const;
