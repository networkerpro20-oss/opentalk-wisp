import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsEnum, MinLength } from 'class-validator';

export class UpdateUserDto {
  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  firstName?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  lastName?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  avatar?: string;

  @ApiProperty({ required: false, enum: ['ADMIN', 'AGENT', 'VIEWER'] })
  @IsEnum(['ADMIN', 'AGENT', 'VIEWER'])
  @IsOptional()
  role?: 'ADMIN' | 'AGENT' | 'VIEWER';

  @ApiProperty({ required: false, enum: ['ACTIVE', 'INACTIVE'] })
  @IsEnum(['ACTIVE', 'INACTIVE'])
  @IsOptional()
  status?: 'ACTIVE' | 'INACTIVE';

  @ApiProperty({ required: false })
  @IsString()
  @MinLength(8)
  @IsOptional()
  password?: string;
}
