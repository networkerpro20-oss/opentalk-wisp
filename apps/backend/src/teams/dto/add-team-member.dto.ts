import { IsString, IsEnum, IsOptional, IsBoolean, IsInt, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { TeamRole } from '@prisma/client';

export class AddTeamMemberDto {
  @ApiProperty()
  @IsString()
  userId: string;

  @ApiProperty({ enum: TeamRole, default: TeamRole.AGENT })
  @IsOptional()
  @IsEnum(TeamRole)
  role?: TeamRole;

  @ApiProperty({ default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiProperty({ default: 5 })
  @IsOptional()
  @IsInt()
  @Min(1)
  maxConcurrentChats?: number;
}
