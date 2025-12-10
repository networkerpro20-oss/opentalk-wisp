import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsUUID } from 'class-validator';

export class SendMessageDto {
  @ApiProperty({ description: 'WhatsApp instance ID' })
  @IsUUID()
  instanceId: string;

  @ApiProperty({ description: 'Recipient phone number (with country code, no +)' })
  @IsString()
  to: string;

  @ApiProperty({ description: 'Message text' })
  @IsString()
  message: string;
}
