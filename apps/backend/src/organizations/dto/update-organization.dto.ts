import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsEnum, IsInt, Min } from 'class-validator';

export class UpdateOrganizationDto {
  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  logo?: string;

  @ApiProperty({ required: false, enum: ['FREE', 'STARTER', 'PRO', 'ENTERPRISE'] })
  @IsEnum(['FREE', 'STARTER', 'PRO', 'ENTERPRISE'])
  @IsOptional()
  plan?: 'FREE' | 'STARTER' | 'PRO' | 'ENTERPRISE';

  @ApiProperty({ required: false })
  @IsInt()
  @Min(1)
  @IsOptional()
  maxUsers?: number;

  @ApiProperty({ required: false })
  @IsInt()
  @Min(1)
  @IsOptional()
  maxContacts?: number;

  @ApiProperty({ required: false })
  @IsInt()
  @Min(1)
  @IsOptional()
  maxWhatsApps?: number;
}
