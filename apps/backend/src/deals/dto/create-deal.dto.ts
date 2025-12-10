import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsUUID,
  IsNumber,
  Min,
} from 'class-validator';

export class CreateDealDto {
  @ApiProperty({ description: 'Deal title' })
  @IsString()
  title: string;

  @ApiPropertyOptional({ description: 'Deal description' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ description: 'Deal value/amount' })
  @IsNumber()
  @Min(0)
  value: number;

  @ApiProperty({ description: 'Currency code (e.g., USD, EUR)' })
  @IsString()
  currency: string;

  @ApiProperty({ description: 'Pipeline ID' })
  @IsUUID()
  pipelineId: string;

  @ApiProperty({ description: 'Stage ID' })
  @IsUUID()
  stageId: string;

  @ApiProperty({ description: 'Contact ID' })
  @IsUUID()
  contactId: string;

  @ApiPropertyOptional({ description: 'Assigned user ID' })
  @IsOptional()
  @IsUUID()
  assignedToId?: string;

  @ApiPropertyOptional({ description: 'Expected close date' })
  @IsOptional()
  expectedCloseDate?: Date;

  @ApiPropertyOptional({ description: 'Custom fields as JSON' })
  @IsOptional()
  customFields?: Record<string, any>;
}
