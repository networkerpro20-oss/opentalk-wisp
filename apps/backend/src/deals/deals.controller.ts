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
import { ApiBearerAuth, ApiOperation, ApiTags, ApiQuery } from '@nestjs/swagger';
import { DealsService } from './deals.service';
import { CreateDealDto } from './dto/create-deal.dto';
import { UpdateDealDto } from './dto/update-deal.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { DealStatus } from '@prisma/client';

@ApiTags('Deals')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('deals')
export class DealsController {
  constructor(private readonly dealsService: DealsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new deal' })
  create(@Req() req: any, @Body() createDealDto: CreateDealDto) {
    return this.dealsService.create(req.user.organizationId, createDealDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all deals with filters' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'pipelineId', required: false, type: String })
  @ApiQuery({ name: 'stageId', required: false, type: String })
  @ApiQuery({ name: 'assignedToId', required: false, type: String })
  @ApiQuery({ name: 'contactId', required: false, type: String })
  @ApiQuery({ name: 'status', required: false, enum: DealStatus })
  findAll(
    @Req() req: any,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('pipelineId') pipelineId?: string,
    @Query('stageId') stageId?: string,
    @Query('assignedToId') assignedToId?: string,
    @Query('contactId') contactId?: string,
    @Query('status') status?: DealStatus,
  ) {
    const pageNum = page ? parseInt(page, 10) : 1;
    const limitNum = limit ? parseInt(limit, 10) : 20;
    const skip = (pageNum - 1) * limitNum;

    return this.dealsService.findAll(req.user.organizationId, {
      skip,
      take: limitNum,
      pipelineId,
      stageId,
      assignedToId,
      contactId,
      status,
    });
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get deals statistics' })
  getStats(@Req() req: any) {
    return this.dealsService.getStats(req.user.organizationId);
  }

  @Get('pipeline/:pipelineId')
  @ApiOperation({ summary: 'Get deals by pipeline with stages' })
  getByPipeline(@Req() req: any, @Param('pipelineId') pipelineId: string) {
    return this.dealsService.getByPipeline(req.user.organizationId, pipelineId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a deal by ID' })
  findOne(@Req() req: any, @Param('id') id: string) {
    return this.dealsService.findOne(req.user.organizationId, id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a deal' })
  update(
    @Req() req: any,
    @Param('id') id: string,
    @Body() updateDealDto: UpdateDealDto,
  ) {
    return this.dealsService.update(req.user.organizationId, id, updateDealDto);
  }

  @Patch(':id/move/:stageId')
  @ApiOperation({ summary: 'Move deal to another stage' })
  moveToStage(
    @Req() req: any,
    @Param('id') id: string,
    @Param('stageId') stageId: string,
  ) {
    return this.dealsService.moveToStage(req.user.organizationId, id, stageId);
  }

  @Patch(':id/won')
  @ApiOperation({ summary: 'Mark deal as won' })
  markAsWon(@Req() req: any, @Param('id') id: string) {
    return this.dealsService.markAsWon(req.user.organizationId, id);
  }

  @Patch(':id/lost')
  @ApiOperation({ summary: 'Mark deal as lost' })
  markAsLost(@Req() req: any, @Param('id') id: string) {
    return this.dealsService.markAsLost(req.user.organizationId, id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a deal' })
  remove(@Req() req: any, @Param('id') id: string) {
    return this.dealsService.remove(req.user.organizationId, id);
  }
}
