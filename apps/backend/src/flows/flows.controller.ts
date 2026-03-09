import { Controller, Get, Post, Body, Patch, Param, Delete, Req, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { FlowsService } from './flows.service';
import { FlowEngineService } from './flow-engine.service';
import { CreateFlowDto } from './dto/create-flow.dto';
import { UpdateFlowDto } from './dto/update-flow.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('flows')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('flows')
export class FlowsController {
  constructor(
    private readonly flowsService: FlowsService,
    private readonly flowEngine: FlowEngineService,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Crear un nuevo flow' })
  create(@Req() req: any, @Body() createFlowDto: CreateFlowDto) {
    const organizationId = req.user.organizationId;
    return this.flowsService.create(organizationId, createFlowDto);
  }

  @Get()
  @ApiOperation({ summary: 'Listar todos los flows' })
  findAll(@Req() req: any) {
    const organizationId = req.user.organizationId;
    return this.flowsService.findAll(organizationId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener un flow específico' })
  findOne(@Req() req: any, @Param('id') id: string) {
    const organizationId = req.user.organizationId;
    return this.flowsService.findOne(id, organizationId);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Actualizar un flow' })
  update(@Req() req: any, @Param('id') id: string, @Body() updateFlowDto: UpdateFlowDto) {
    const organizationId = req.user.organizationId;
    return this.flowsService.update(id, organizationId, updateFlowDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Eliminar un flow' })
  remove(@Req() req: any, @Param('id') id: string) {
    const organizationId = req.user.organizationId;
    return this.flowsService.remove(id, organizationId);
  }

  @Post(':id/toggle')
  @ApiOperation({ summary: 'Activar/Desactivar un flow' })
  toggleActive(@Req() req: any, @Param('id') id: string) {
    const organizationId = req.user.organizationId;
    return this.flowsService.toggleActive(id, organizationId);
  }

  @Post(':id/test')
  @ApiOperation({ summary: 'Ejecutar un flow manualmente para testing' })
  async testFlow(@Req() req: any, @Param('id') id: string, @Body() context: any) {
    const organizationId = req.user.organizationId;
    await this.flowEngine.executeFlow(id, {
      flowId: id,
      organizationId,
      variables: context.variables || {},
      ...context,
    });
    return { message: 'Flow executed successfully' };
  }
}
