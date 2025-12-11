import { IsString, IsBoolean, IsOptional, IsInt, Min, IsObject } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateTeamDto {
  @ApiProperty()
  @IsString()
  name: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiProperty({ default: 10 })
  @IsOptional()
  @IsInt()
  @Min(1)
  maxConcurrentChats?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsObject()
  workingHours?: any;
}
