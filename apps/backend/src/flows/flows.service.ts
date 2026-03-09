import { Injectable, Logger, NotFoundException, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateFlowDto } from './dto/create-flow.dto';
import { UpdateFlowDto } from './dto/update-flow.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class FlowsService {
  private readonly logger = new Logger(FlowsService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * Crear un nuevo flow
   */
  async create(organizationId: string, createFlowDto: CreateFlowDto) {
    try {
      const flow = await this.prisma.flow.create({
        data: {
          name: createFlowDto.name,
          trigger: createFlowDto.trigger as any,
          status: createFlowDto.isActive ? 'ACTIVE' : 'INACTIVE',
          organizationId,
          config: {
            description: createFlowDto.description || '',
            nodes: createFlowDto.nodes || [],
            edges: createFlowDto.edges || [],
          } as any,
        },
      });

      this.logger.log(`Flow created: ${flow.id}`);
      return flow;
    } catch (error) {
      this.logger.error('Error creating flow:', error);
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2003') {
          throw new BadRequestException('Invalid organization ID');
        }
      }
      throw new InternalServerErrorException('Failed to create flow');
    }
  }

  /**
   * Listar flows de una organización
   */
  async findAll(organizationId: string) {
    return this.prisma.flow.findMany({
      where: { organizationId },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Obtener un flow específico
   */
  async findOne(id: string, organizationId: string) {
    const flow = await this.prisma.flow.findFirst({
      where: { 
        id,
        organizationId,
      },
    });

    if (!flow) {
      throw new NotFoundException('Flow not found');
    }

    return flow;
  }

  /**
   * Actualizar un flow
   */
  async update(id: string, organizationId: string, updateFlowDto: UpdateFlowDto) {
    await this.findOne(id, organizationId); // Verificar que existe

    const updateData: any = {};
    if (updateFlowDto.name) updateData.name = updateFlowDto.name;
    if (updateFlowDto.trigger) updateData.trigger = updateFlowDto.trigger;
    if (updateFlowDto.isActive !== undefined) {
      updateData.status = updateFlowDto.isActive ? 'ACTIVE' : 'INACTIVE';
    }
    if (updateFlowDto.nodes || updateFlowDto.edges || updateFlowDto.description) {
      updateData.config = {
        description: updateFlowDto.description,
        nodes: updateFlowDto.nodes,
        edges: updateFlowDto.edges,
      };
    }

    const flow = await this.prisma.flow.update({
      where: { id },
      data: updateData,
    });

    this.logger.log(`Flow updated: ${flow.id}`);
    return flow;
  }

  /**
   * Eliminar un flow
   */
  async remove(id: string, organizationId: string) {
    await this.findOne(id, organizationId); // Verificar que existe

    await this.prisma.flow.delete({
      where: { id },
    });

    this.logger.log(`Flow deleted: ${id}`);
    return { message: 'Flow deleted successfully' };
  }

  /**
   * Activar/Desactivar un flow
   */
  async toggleActive(id: string, organizationId: string) {
    const flow = await this.findOne(id, organizationId);

    const updated = await this.prisma.flow.update({
      where: { id },
      data: { status: flow.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE' },
    });

    this.logger.log(`Flow ${updated.status === 'ACTIVE' ? 'activated' : 'deactivated'}: ${id}`);
    return updated;
  }

  /**
   * Obtener flows activos por trigger
   */
  async findByTrigger(trigger: string, organizationId: string) {
    return this.prisma.flow.findMany({
      where: {
        organizationId,
        trigger: trigger as any,
        status: 'ACTIVE',
      },
    });
  }
}
