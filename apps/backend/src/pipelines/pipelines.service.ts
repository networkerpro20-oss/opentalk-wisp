import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePipelineDto } from './dto/create-pipeline.dto';
import { CreateStageDto } from './dto/create-stage.dto';

@Injectable()
export class PipelinesService {
  constructor(private prisma: PrismaService) {}

  async create(organizationId: string, dto: CreatePipelineDto) {
    const maxOrder = await this.prisma.pipeline.aggregate({
      where: { organizationId },
      _max: { order: true },
    });

    return this.prisma.pipeline.create({
      data: {
        name: dto.name,
        order: dto.order ?? (maxOrder._max.order ?? -1) + 1,
        organizationId,
      },
      include: { stages: { orderBy: { order: 'asc' } } },
    });
  }

  async findAll(organizationId: string) {
    return this.prisma.pipeline.findMany({
      where: { organizationId },
      orderBy: { order: 'asc' },
      include: {
        stages: {
          orderBy: { order: 'asc' },
          include: {
            _count: { select: { deals: true } },
          },
        },
        _count: { select: { deals: true } },
      },
    });
  }

  async findOne(organizationId: string, id: string) {
    const pipeline = await this.prisma.pipeline.findFirst({
      where: { id, organizationId },
      include: {
        stages: {
          orderBy: { order: 'asc' },
          include: {
            _count: { select: { deals: true } },
          },
        },
      },
    });

    if (!pipeline) {
      throw new NotFoundException(`Pipeline with ID ${id} not found`);
    }

    return pipeline;
  }

  async update(organizationId: string, id: string, dto: Partial<CreatePipelineDto>) {
    const pipeline = await this.prisma.pipeline.findFirst({
      where: { id, organizationId },
    });

    if (!pipeline) {
      throw new NotFoundException(`Pipeline with ID ${id} not found`);
    }

    return this.prisma.pipeline.update({
      where: { id },
      data: dto,
      include: { stages: { orderBy: { order: 'asc' } } },
    });
  }

  async remove(organizationId: string, id: string) {
    const pipeline = await this.prisma.pipeline.findFirst({
      where: { id, organizationId },
    });

    if (!pipeline) {
      throw new NotFoundException(`Pipeline with ID ${id} not found`);
    }

    return this.prisma.pipeline.delete({ where: { id } });
  }

  // Stage operations

  async createStage(organizationId: string, pipelineId: string, dto: CreateStageDto) {
    const pipeline = await this.prisma.pipeline.findFirst({
      where: { id: pipelineId, organizationId },
    });

    if (!pipeline) {
      throw new NotFoundException(`Pipeline with ID ${pipelineId} not found`);
    }

    return this.prisma.stage.create({
      data: {
        name: dto.name,
        order: dto.order,
        color: dto.color,
        pipelineId,
      },
    });
  }

  async updateStage(
    organizationId: string,
    pipelineId: string,
    stageId: string,
    dto: Partial<CreateStageDto>,
  ) {
    const pipeline = await this.prisma.pipeline.findFirst({
      where: { id: pipelineId, organizationId },
    });

    if (!pipeline) {
      throw new NotFoundException(`Pipeline with ID ${pipelineId} not found`);
    }

    const stage = await this.prisma.stage.findFirst({
      where: { id: stageId, pipelineId },
    });

    if (!stage) {
      throw new NotFoundException(`Stage with ID ${stageId} not found`);
    }

    return this.prisma.stage.update({
      where: { id: stageId },
      data: dto,
    });
  }

  async deleteStage(organizationId: string, pipelineId: string, stageId: string) {
    const pipeline = await this.prisma.pipeline.findFirst({
      where: { id: pipelineId, organizationId },
    });

    if (!pipeline) {
      throw new NotFoundException(`Pipeline with ID ${pipelineId} not found`);
    }

    const stage = await this.prisma.stage.findFirst({
      where: { id: stageId, pipelineId },
    });

    if (!stage) {
      throw new NotFoundException(`Stage with ID ${stageId} not found`);
    }

    return this.prisma.stage.delete({ where: { id: stageId } });
  }

  async reorderStages(organizationId: string, pipelineId: string, stageIds: string[]) {
    const pipeline = await this.prisma.pipeline.findFirst({
      where: { id: pipelineId, organizationId },
    });

    if (!pipeline) {
      throw new NotFoundException(`Pipeline with ID ${pipelineId} not found`);
    }

    const updates = stageIds.map((id, index) =>
      this.prisma.stage.update({
        where: { id },
        data: { order: index },
      }),
    );

    await this.prisma.$transaction(updates);

    return this.prisma.stage.findMany({
      where: { pipelineId },
      orderBy: { order: 'asc' },
    });
  }
}
