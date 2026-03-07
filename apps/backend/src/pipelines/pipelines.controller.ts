import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  Req,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { PipelinesService } from './pipelines.service';
import { CreatePipelineDto } from './dto/create-pipeline.dto';
import { CreateStageDto } from './dto/create-stage.dto';
import { ReorderStagesDto } from './dto/reorder-stages.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Pipelines')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('pipelines')
export class PipelinesController {
  constructor(private readonly pipelinesService: PipelinesService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new pipeline' })
  create(@Req() req: any, @Body() dto: CreatePipelineDto) {
    return this.pipelinesService.create(req.user.organizationId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all pipelines' })
  findAll(@Req() req: any) {
    return this.pipelinesService.findAll(req.user.organizationId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a pipeline by ID' })
  findOne(@Req() req: any, @Param('id') id: string) {
    return this.pipelinesService.findOne(req.user.organizationId, id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a pipeline' })
  update(@Req() req: any, @Param('id') id: string, @Body() dto: CreatePipelineDto) {
    return this.pipelinesService.update(req.user.organizationId, id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a pipeline' })
  remove(@Req() req: any, @Param('id') id: string) {
    return this.pipelinesService.remove(req.user.organizationId, id);
  }

  // Stage endpoints

  @Post(':pipelineId/stages')
  @ApiOperation({ summary: 'Create a stage in a pipeline' })
  createStage(
    @Req() req: any,
    @Param('pipelineId') pipelineId: string,
    @Body() dto: CreateStageDto,
  ) {
    return this.pipelinesService.createStage(req.user.organizationId, pipelineId, dto);
  }

  @Patch(':pipelineId/stages/reorder')
  @ApiOperation({ summary: 'Reorder stages in a pipeline' })
  reorderStages(
    @Req() req: any,
    @Param('pipelineId') pipelineId: string,
    @Body() dto: ReorderStagesDto,
  ) {
    return this.pipelinesService.reorderStages(req.user.organizationId, pipelineId, dto.stageIds);
  }

  @Patch(':pipelineId/stages/:stageId')
  @ApiOperation({ summary: 'Update a stage' })
  updateStage(
    @Req() req: any,
    @Param('pipelineId') pipelineId: string,
    @Param('stageId') stageId: string,
    @Body() dto: CreateStageDto,
  ) {
    return this.pipelinesService.updateStage(req.user.organizationId, pipelineId, stageId, dto);
  }

  @Delete(':pipelineId/stages/:stageId')
  @ApiOperation({ summary: 'Delete a stage' })
  deleteStage(
    @Req() req: any,
    @Param('pipelineId') pipelineId: string,
    @Param('stageId') stageId: string,
  ) {
    return this.pipelinesService.deleteStage(req.user.organizationId, pipelineId, stageId);
  }
}
