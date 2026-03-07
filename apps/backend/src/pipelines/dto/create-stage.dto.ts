import { IsString, IsOptional, IsInt } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateStageDto {
  @ApiProperty()
  @IsString()
  name: string;

  @ApiProperty()
  @IsInt()
  order: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  color?: string;
}
