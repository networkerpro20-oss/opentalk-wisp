import { Controller, Get, Patch, Param, Body, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { PresenceService } from './presence.service';
import { UpdatePresenceDto } from './dto/update-presence.dto';

@ApiTags('presence')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('presence')
export class PresenceController {
  constructor(private readonly presenceService: PresenceService) {}

  @Patch('me')
  updateMyStatus(@CurrentUser() user: any, @Body() updatePresenceDto: UpdatePresenceDto) {
    return this.presenceService.updateStatus(user.id, user.organizationId, updatePresenceDto);
  }

  @Get('me')
  getMyStatus(@CurrentUser() user: any) {
    return this.presenceService.getCurrentStatus(user.id, user.organizationId);
  }

  @Get('user/:userId')
  getUserStatus(@CurrentUser() user: any, @Param('userId') userId: string) {
    return this.presenceService.getCurrentStatus(userId, user.organizationId);
  }

  @Get('team/:teamId')
  getTeamPresence(@CurrentUser() user: any, @Param('teamId') teamId: string) {
    return this.presenceService.getTeamPresence(teamId, user.organizationId);
  }

  @Get('online')
  getOnlineUsers(@CurrentUser() user: any) {
    return this.presenceService.getOnlineUsers(user.organizationId);
  }

  @Patch('heartbeat')
  updateHeartbeat(@CurrentUser() user: any) {
    return this.presenceService.updateLastSeen(user.id);
  }
}
