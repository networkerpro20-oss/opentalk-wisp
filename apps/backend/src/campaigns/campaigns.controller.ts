import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Req,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CampaignsService } from './campaigns.service';
import { CreateCampaignDto, CampaignStatus } from './dto/create-campaign.dto';
import { UpdateCampaignDto } from './dto/update-campaign.dto';

@ApiTags('Campaigns')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('campaigns')
export class CampaignsController {
  constructor(private readonly campaignsService: CampaignsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new campaign' })
  create(@Req() req: any, @Body() createCampaignDto: CreateCampaignDto) {
    return this.campaignsService.create(
      req.user.organizationId,
      req.user.userId,
      createCampaignDto,
    );
  }

  @Get()
  @ApiOperation({ summary: 'Get all campaigns' })
  @ApiQuery({ name: 'status', enum: CampaignStatus, required: false })
  findAll(@Req() req: any, @Query('status') status?: CampaignStatus) {
    return this.campaignsService.findAll(req.user.organizationId, status);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a campaign by ID' })
  findOne(@Req() req: any, @Param('id') id: string) {
    return this.campaignsService.findOne(id, req.user.organizationId);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a campaign' })
  update(
    @Req() req: any,
    @Param('id') id: string,
    @Body() updateCampaignDto: UpdateCampaignDto,
  ) {
    return this.campaignsService.update(id, req.user.organizationId, updateCampaignDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a campaign' })
  remove(@Req() req: any, @Param('id') id: string) {
    return this.campaignsService.delete(id, req.user.organizationId);
  }

  @Post(':id/start')
  @ApiOperation({ summary: 'Start a campaign' })
  start(@Req() req: any, @Param('id') id: string) {
    return this.campaignsService.start(id, req.user.organizationId);
  }

  @Post(':id/pause')
  @ApiOperation({ summary: 'Pause a campaign' })
  pause(@Req() req: any, @Param('id') id: string) {
    return this.campaignsService.pause(id, req.user.organizationId);
  }

  @Post(':id/resume')
  @ApiOperation({ summary: 'Resume a paused campaign' })
  resume(@Req() req: any, @Param('id') id: string) {
    return this.campaignsService.resume(id, req.user.organizationId);
  }

  @Get(':id/stats')
  @ApiOperation({ summary: 'Get campaign statistics' })
  getStats(@Req() req: any, @Param('id') id: string) {
    return this.campaignsService.getStats(id, req.user.organizationId);
  }

  @Get(':id/analytics')
  @ApiOperation({ summary: 'Get detailed campaign analytics with A/B variant data' })
  getAnalytics(@Req() req: any, @Param('id') id: string) {
    return this.campaignsService.getAnalytics(id, req.user.organizationId);
  }

  @Post('generate-message')
  @ApiOperation({ summary: 'Generate campaign message using AI' })
  generateMessage(@Req() req: any, @Body() body: { brief: string }) {
    return this.campaignsService.generateCampaignMessage(body.brief, req.user.organizationId);
  }

  @Post('generate-audio')
  @ApiOperation({ summary: 'Generate TTS audio from text' })
  async generateAudio(@Body() body: { text: string; voice?: string }, @Req() req: any) {
    const audioBuffer = await this.campaignsService.generateAudio(body.text, body.voice);
    const base64 = audioBuffer.toString('base64');
    return {
      audio: `data:audio/mp3;base64,${base64}`,
      size: audioBuffer.length,
    };
  }
}
