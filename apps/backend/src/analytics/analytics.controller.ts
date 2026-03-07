import { Controller, Get, Query, UseGuards, Req } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AnalyticsService } from './analytics.service';

@ApiTags('Analytics')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('overview')
  @ApiOperation({ summary: 'Get analytics overview KPIs' })
  getOverview(@Req() req: any, @Query('days') days?: string) {
    return this.analyticsService.getOverview(
      req.user.organizationId,
      days ? parseInt(days, 10) : 30,
    );
  }

  @Get('conversations-by-day')
  @ApiOperation({ summary: 'Get conversations grouped by day' })
  getConversationsByDay(@Req() req: any, @Query('days') days?: string) {
    return this.analyticsService.getConversationsByDay(
      req.user.organizationId,
      days ? parseInt(days, 10) : 30,
    );
  }

  @Get('deals-by-stage')
  @ApiOperation({ summary: 'Get deals grouped by pipeline stage' })
  getDealsByStage(@Req() req: any) {
    return this.analyticsService.getDealsByStage(req.user.organizationId);
  }

  @Get('top-agents')
  @ApiOperation({ summary: 'Get top performing agents' })
  getTopAgents(@Req() req: any, @Query('days') days?: string) {
    return this.analyticsService.getTopAgents(
      req.user.organizationId,
      days ? parseInt(days, 10) : 30,
    );
  }

  @Get('channels')
  @ApiOperation({ summary: 'Get conversation distribution by channel' })
  getChannelDistribution(@Req() req: any) {
    return this.analyticsService.getChannelDistribution(req.user.organizationId);
  }
}
