import { IsEnum, IsString, IsBoolean, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

enum PresenceStatus {
  ONLINE = 'ONLINE',
  BUSY = 'BUSY',
  AWAY = 'AWAY',
  OFFLINE = 'OFFLINE',
}

export class UpdatePresenceDto {
  @ApiProperty({ enum: PresenceStatus })
  @IsEnum(PresenceStatus)
  status: PresenceStatus;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  customMessage?: string;

  @ApiProperty({ required: false, default: false })
  @IsOptional()
  @IsBoolean()
  isOnBreak?: boolean;
}

export { PresenceStatus };
