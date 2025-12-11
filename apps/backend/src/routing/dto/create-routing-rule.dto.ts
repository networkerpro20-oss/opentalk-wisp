import { IsString, IsInt, IsBoolean, IsEnum, IsOptional, IsObject, Min, Max } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

enum AssignmentType {
  ROUND_ROBIN = 'ROUND_ROBIN',
  LEAST_BUSY = 'LEAST_BUSY',
  SPECIFIC_USER = 'SPECIFIC_USER',
  SPECIFIC_TEAM = 'SPECIFIC_TEAM',
  LOAD_BALANCED = 'LOAD_BALANCED',
}

export class CreateRoutingRuleDto {
  @ApiProperty()
  @IsString()
  name: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ default: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(100)
  priority?: number;

  @ApiProperty({ default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiProperty({
    description: 'Conditions as JSON object',
    example: { channel: 'WHATSAPP', keywords: ['urgent', 'importante'], tags: [] },
  })
  @IsObject()
  conditions: any;

  @ApiProperty({ enum: AssignmentType, default: AssignmentType.ROUND_ROBIN })
  @IsEnum(AssignmentType)
  assignmentType: AssignmentType;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  assignToUserId?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  assignToTeamId?: string;
}
