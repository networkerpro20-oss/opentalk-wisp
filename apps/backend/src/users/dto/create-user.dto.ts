import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MinLength, IsEnum, IsOptional } from 'class-validator';

export class CreateUserDto {
  @ApiProperty({ example: 'user@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'SecurePass123!' })
  @IsString()
  @MinLength(8)
  password: string;

  @ApiProperty({ example: 'John' })
  @IsString()
  firstName: string;

  @ApiProperty({ example: 'Doe' })
  @IsString()
  lastName: string;

  @ApiProperty({ example: 'AGENT', enum: ['ADMIN', 'AGENT', 'VIEWER'] })
  @IsEnum(['ADMIN', 'AGENT', 'VIEWER'])
  @IsOptional()
  role?: 'ADMIN' | 'AGENT' | 'VIEWER';
}
