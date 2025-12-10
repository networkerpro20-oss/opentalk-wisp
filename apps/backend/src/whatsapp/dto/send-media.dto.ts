import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsUUID, IsEnum, IsOptional, IsUrl } from 'class-validator';

export enum MediaType {
  IMAGE = 'image',
  VIDEO = 'video',
  AUDIO = 'audio',
  DOCUMENT = 'document',
}

export class SendMediaDto {
  @ApiProperty({ description: 'WhatsApp instance ID' })
  @IsUUID()
  instanceId: string;

  @ApiProperty({ description: 'Recipient phone number (with country code, no +)' })
  @IsString()
  to: string;

  @ApiProperty({ 
    description: 'Media type', 
    enum: MediaType,
    example: MediaType.IMAGE 
  })
  @IsEnum(MediaType)
  type: MediaType;

  @ApiProperty({ 
    description: 'URL of the media file or base64 encoded data',
    example: 'https://example.com/image.jpg' 
  })
  @IsString()
  mediaUrl: string;

  @ApiProperty({ 
    description: 'Caption for the media (optional)',
    required: false 
  })
  @IsOptional()
  @IsString()
  caption?: string;

  @ApiProperty({ 
    description: 'Filename for documents (optional)',
    required: false 
  })
  @IsOptional()
  @IsString()
  fileName?: string;

  @ApiProperty({ 
    description: 'MIME type (optional, auto-detected if not provided)',
    required: false,
    example: 'image/jpeg'
  })
  @IsOptional()
  @IsString()
  mimeType?: string;
}
