import { Controller, Get, Post, Patch, Delete, Param, Body, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { RoutingService } from './routing.service';
import { CreateRoutingRuleDto } from './dto/create-routing-rule.dto';
import { UpdateRoutingRuleDto } from './dto/update-routing-rule.dto';

@ApiTags('routing')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('routing')
export class RoutingController {
  constructor(private readonly routingService: RoutingService) {}

  @Post()
  create(@CurrentUser() user: any, @Body() createRoutingRuleDto: CreateRoutingRuleDto) {
    return this.routingService.create(user.organizationId, createRoutingRuleDto);
  }

  @Get()
  findAll(@CurrentUser() user: any) {
    return this.routingService.findAll(user.organizationId);
  }

  @Get(':id')
  findOne(@CurrentUser() user: any, @Param('id') id: string) {
    return this.routingService.findOne(id, user.organizationId);
  }

  @Patch(':id')
  update(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body() updateRoutingRuleDto: UpdateRoutingRuleDto,
  ) {
    return this.routingService.update(id, user.organizationId, updateRoutingRuleDto);
  }

  @Delete(':id')
  remove(@CurrentUser() user: any, @Param('id') id: string) {
    return this.routingService.remove(id, user.organizationId);
  }

  @Post('evaluate/:conversationId')
  evaluateRules(@CurrentUser() user: any, @Param('conversationId') conversationId: string) {
    return this.routingService.evaluateRules(conversationId, user.organizationId);
  }
}
