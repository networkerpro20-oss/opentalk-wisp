import { IsArray, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AssignTagsDto {
  @ApiProperty({ type: [String], description: 'Array of tag IDs to assign' })
  @IsArray()
  @IsString({ each: true })
  tagIds: string[];
}
