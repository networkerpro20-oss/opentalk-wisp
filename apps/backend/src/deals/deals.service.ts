import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateDealDto } from './dto/create-deal.dto';
import { UpdateDealDto } from './dto/update-deal.dto';
import { Deal, Prisma, DealStatus } from '@prisma/client';

@Injectable()
export class DealsService {
  constructor(private prisma: PrismaService) {}

  async create(
    organizationId: string,
    createDealDto: CreateDealDto,
  ): Promise<Deal> {
    return this.prisma.deal.create({
      data: {
        ...createDealDto,
        organizationId,
        status: DealStatus.OPEN,
      },
      include: {
        contact: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            avatar: true,
          },
        },
        assignedTo: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatar: true,
          },
        },
        pipeline: true,
        stage: true,
      },
    });
  }

  async findAll(
    organizationId: string,
    params?: {
      skip?: number;
      take?: number;
      pipelineId?: string;
      stageId?: string;
      assignedToId?: string;
      contactId?: string;
      status?: DealStatus;
      orderBy?: Prisma.DealOrderByWithRelationInput;
    },
  ) {
    const {
      skip = 0,
      take = 20,
      pipelineId,
      stageId,
      assignedToId,
      contactId,
      status,
      orderBy,
    } = params || {};

    const where: Prisma.DealWhereInput = {
      organizationId,
      ...(pipelineId && { pipelineId }),
      ...(stageId && { stageId }),
      ...(assignedToId && { assignedToId }),
      ...(contactId && { contactId }),
      ...(status && { status }),
    };

    const [deals, total] = await Promise.all([
      this.prisma.deal.findMany({
        where,
        skip,
        take,
        orderBy: orderBy || { createdAt: 'desc' },
        include: {
          contact: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
              avatar: true,
            },
          },
          assignedTo: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              avatar: true,
            },
          },
          pipeline: {
            select: {
              id: true,
              name: true,
            },
          },
          stage: {
            select: {
              id: true,
              name: true,
              order: true,
            },
          },
        },
      }),
      this.prisma.deal.count({ where }),
    ]);

    return {
      data: deals,
      meta: {
        total,
        page: Math.floor(skip / take) + 1,
        lastPage: Math.ceil(total / take),
        perPage: take,
      },
    };
  }

  async findOne(organizationId: string, id: string): Promise<Deal> {
    const deal = await this.prisma.deal.findFirst({
      where: { id, organizationId },
      include: {
        contact: true,
        assignedTo: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatar: true,
            email: true,
          },
        },
        pipeline: {
          include: {
            stages: {
              orderBy: { order: 'asc' },
            },
          },
        },
        stage: true,
        activities: {
          take: 20,
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!deal) {
      throw new NotFoundException(`Deal with ID ${id} not found`);
    }

    return deal;
  }

  async update(
    organizationId: string,
    id: string,
    updateDealDto: UpdateDealDto,
  ): Promise<Deal> {
    const deal = await this.prisma.deal.findFirst({
      where: { id, organizationId },
    });

    if (!deal) {
      throw new NotFoundException(`Deal with ID ${id} not found`);
    }

    return this.prisma.deal.update({
      where: { id },
      data: updateDealDto,
      include: {
        contact: true,
        assignedTo: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatar: true,
          },
        },
        pipeline: true,
        stage: true,
      },
    });
  }

  async remove(organizationId: string, id: string): Promise<Deal> {
    const deal = await this.prisma.deal.findFirst({
      where: { id, organizationId },
    });

    if (!deal) {
      throw new NotFoundException(`Deal with ID ${id} not found`);
    }

    return this.prisma.deal.delete({
      where: { id },
    });
  }

  async moveToStage(
    organizationId: string,
    dealId: string,
    stageId: string,
  ): Promise<Deal> {
    const deal = await this.prisma.deal.findFirst({
      where: { id: dealId, organizationId },
    });

    if (!deal) {
      throw new NotFoundException(`Deal with ID ${dealId} not found`);
    }

    return this.prisma.deal.update({
      where: { id: dealId },
      data: { stageId },
      include: {
        contact: true,
        assignedTo: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatar: true,
          },
        },
        pipeline: true,
        stage: true,
      },
    });
  }

  async markAsWon(organizationId: string, id: string): Promise<Deal> {
    const deal = await this.prisma.deal.findFirst({
      where: { id, organizationId },
    });

    if (!deal) {
      throw new NotFoundException(`Deal with ID ${id} not found`);
    }

    return this.prisma.deal.update({
      where: { id },
      data: {
        status: DealStatus.WON,
        closedDate: new Date(),
      },
    });
  }

  async markAsLost(organizationId: string, id: string): Promise<Deal> {
    const deal = await this.prisma.deal.findFirst({
      where: { id, organizationId },
    });

    if (!deal) {
      throw new NotFoundException(`Deal with ID ${id} not found`);
    }

    return this.prisma.deal.update({
      where: { id },
      data: {
        status: DealStatus.LOST,
        closedDate: new Date(),
      },
    });
  }

  async getStats(organizationId: string) {
    const [total, open, won, lost, totalValue, wonValue] = await Promise.all([
      this.prisma.deal.count({ where: { organizationId } }),
      this.prisma.deal.count({
        where: { organizationId, status: DealStatus.OPEN },
      }),
      this.prisma.deal.count({
        where: { organizationId, status: DealStatus.WON },
      }),
      this.prisma.deal.count({
        where: { organizationId, status: DealStatus.LOST },
      }),
      this.prisma.deal.aggregate({
        where: { organizationId },
        _sum: { value: true },
      }),
      this.prisma.deal.aggregate({
        where: { organizationId, status: DealStatus.WON },
        _sum: { value: true },
      }),
    ]);

    const closedDeals = won + lost;
    const conversionRate = closedDeals > 0 ? Math.round((won / closedDeals) * 100 * 10) / 10 : 0;

    return {
      total,
      totalDeals: total,
      open,
      won,
      lost,
      totalValue: totalValue._sum.value || 0,
      wonValue: wonValue._sum.value || 0,
      conversionRate,
    };
  }

  async getByPipeline(organizationId: string, pipelineId: string) {
    const pipeline = await this.prisma.pipeline.findFirst({
      where: { id: pipelineId, organizationId },
      include: {
        stages: {
          orderBy: { order: 'asc' },
          include: {
            deals: {
              where: {
                status: DealStatus.OPEN,
              },
              include: {
                contact: {
                  select: {
                    id: true,
                    name: true,
                    avatar: true,
                  },
                },
                assignedTo: {
                  select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    avatar: true,
                  },
                },
              },
            },
            _count: {
              select: {
                deals: true,
              },
            },
          },
        },
      },
    });

    if (!pipeline) {
      throw new NotFoundException(`Pipeline with ID ${pipelineId} not found`);
    }

    return pipeline;
  }
}
