import { IsArray, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ReorderStagesDto {
  @ApiProperty({ type: [String] })
  @IsArray()
  @IsString({ each: true })
  stageIds: string[];
}
