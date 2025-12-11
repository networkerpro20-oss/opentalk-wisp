import { IsString, IsHexColor, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateTagDto {
  @ApiProperty()
  @IsString()
  @MaxLength(50)
  name: string;

  @ApiProperty({ description: 'Hex color code', example: '#FF5733' })
  @IsHexColor()
  color: string;
}
