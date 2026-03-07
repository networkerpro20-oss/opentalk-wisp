import {
  Controller, Get, Post, Patch, Delete, Body, Param, Query, Req, UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { WebhooksService } from './webhooks.service';
import { WebhookDispatcherService } from './webhook-dispatcher.service';
import { CreateWebhookDto, UpdateWebhookDto, WEBHOOK_EVENTS } from './dto/create-webhook.dto';

@ApiTags('Webhooks')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('webhooks')
export class WebhooksController {
  constructor(
    private readonly webhooksService: WebhooksService,
    private readonly dispatcher: WebhookDispatcherService,
  ) {}

  @Get('events')
  @ApiOperation({ summary: 'List available webhook events' })
  getEvents() {
    return { events: WEBHOOK_EVENTS };
  }

  @Post()
  @ApiOperation({ summary: 'Create a webhook' })
  create(@Req() req: any, @Body() dto: CreateWebhookDto) {
    return this.webhooksService.create(req.user.organizationId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'List all webhooks' })
  findAll(@Req() req: any) {
    return this.webhooksService.findAll(req.user.organizationId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get webhook details with logs' })
  findOne(@Req() req: any, @Param('id') id: string) {
    return this.webhooksService.findOne(id, req.user.organizationId);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a webhook' })
  update(@Req() req: any, @Param('id') id: string, @Body() dto: UpdateWebhookDto) {
    return this.webhooksService.update(id, req.user.organizationId, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a webhook' })
  remove(@Req() req: any, @Param('id') id: string) {
    return this.webhooksService.delete(id, req.user.organizationId);
  }

  @Get(':id/logs')
  @ApiOperation({ summary: 'Get webhook delivery logs' })
  getLogs(
    @Req() req: any,
    @Param('id') id: string,
    @Query('page') page?: string,
  ) {
    return this.webhooksService.getLogs(id, req.user.organizationId, parseInt(page || '1'));
  }

  @Post(':id/test')
  @ApiOperation({ summary: 'Send a test webhook event' })
  async test(@Req() req: any, @Param('id') id: string) {
    const webhook = await this.webhooksService.findOne(id, req.user.organizationId);
    await this.dispatcher.dispatch('test', req.user.organizationId, {
      message: 'This is a test webhook event',
      webhookId: webhook.id,
    });
    return { message: 'Test event dispatched' };
  }
}
