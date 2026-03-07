import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsEnum, IsNumber, IsBoolean, Min, Max } from 'class-validator';

export class CreateKnowledgeBaseDto {
  @ApiProperty({ example: 'Mi Base de Conocimiento' })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  systemPrompt?: string;

  @ApiProperty({ enum: ['PROFESSIONAL', 'FRIENDLY', 'AGGRESSIVE', 'EDUCATIONAL'], default: 'PROFESSIONAL' })
  @IsEnum(['PROFESSIONAL', 'FRIENDLY', 'AGGRESSIVE', 'EDUCATIONAL'])
  @IsOptional()
  personality?: string;

  @ApiProperty({ default: 0.7, minimum: 0, maximum: 1 })
  @IsNumber()
  @Min(0)
  @Max(1)
  @IsOptional()
  confidenceThreshold?: number;

  @ApiProperty({ default: false })
  @IsBoolean()
  @IsOptional()
  autoResponseEnabled?: boolean;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  outsideHoursMessage?: string;
}
