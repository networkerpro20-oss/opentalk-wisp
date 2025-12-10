import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional } from 'class-validator';

export class CreateWhatsAppInstanceDto {
  @ApiProperty({ description: 'Instance name' })
  @IsString()
  name: string;

  @ApiPropertyOptional({ description: 'Phone number (without +)' })
  @IsOptional()
  @IsString()
  phone?: string;
}
