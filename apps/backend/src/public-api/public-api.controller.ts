import { Controller, Get, Post, Patch, Param, Body, Query, Req, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiHeader } from '@nestjs/swagger';
import { ApiKeyGuard } from './api-key.guard';
import { PrismaService } from '../prisma/prisma.service';

@ApiTags('Public API')
@ApiHeader({ name: 'x-api-key', description: 'API Key for authentication' })
@UseGuards(ApiKeyGuard)
@Controller('v1')
export class PublicApiController {
  constructor(private prisma: PrismaService) {}

  // ============ CONTACTS ============

  @Get('contacts')
  @ApiOperation({ summary: 'List contacts' })
  async listContacts(
    @Req() req: any,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
  ) {
    const p = parseInt(page || '1');
    const l = Math.min(parseInt(limit || '50'), 100);
    const where: any = { organizationId: req.organizationId };
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [data, total] = await Promise.all([
      this.prisma.contact.findMany({
        where,
        skip: (p - 1) * l,
        take: l,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.contact.count({ where }),
    ]);

    return { data, meta: { page: p, limit: l, total } };
  }

  @Get('contacts/:id')
  @ApiOperation({ summary: 'Get a contact' })
  async getContact(@Req() req: any, @Param('id') id: string) {
    return this.prisma.contact.findFirst({
      where: { id, organizationId: req.organizationId },
      include: { tags: { include: { tag: true } } },
    });
  }

  @Post('contacts')
  @ApiOperation({ summary: 'Create a contact' })
  async createContact(@Req() req: any, @Body() body: { name: string; phone?: string; email?: string }) {
    return this.prisma.contact.create({
      data: {
        name: body.name,
        phone: body.phone,
        email: body.email,
        organizationId: req.organizationId,
      },
    });
  }

  @Patch('contacts/:id')
  @ApiOperation({ summary: 'Update a contact' })
  async updateContact(@Req() req: any, @Param('id') id: string, @Body() body: any) {
    const contact = await this.prisma.contact.findFirst({
      where: { id, organizationId: req.organizationId },
    });
    if (!contact) return { error: 'Contact not found' };

    return this.prisma.contact.update({
      where: { id },
      data: {
        ...(body.name && { name: body.name }),
        ...(body.phone && { phone: body.phone }),
        ...(body.email !== undefined && { email: body.email }),
        ...(body.company !== undefined && { company: body.company }),
      },
    });
  }

  // ============ CONVERSATIONS ============

  @Get('conversations')
  @ApiOperation({ summary: 'List conversations' })
  async listConversations(
    @Req() req: any,
    @Query('status') status?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const p = parseInt(page || '1');
    const l = Math.min(parseInt(limit || '50'), 100);
    const where: any = { organizationId: req.organizationId };
    if (status) where.status = status;

    const [data, total] = await Promise.all([
      this.prisma.conversation.findMany({
        where,
        skip: (p - 1) * l,
        take: l,
        orderBy: { lastMessageAt: 'desc' },
        include: {
          contact: { select: { id: true, name: true, phone: true } },
          assignedTo: { select: { id: true, firstName: true, lastName: true } },
        },
      }),
      this.prisma.conversation.count({ where }),
    ]);

    return { data, meta: { page: p, limit: l, total } };
  }

  @Get('conversations/:id/messages')
  @ApiOperation({ summary: 'Get conversation messages' })
  async getMessages(
    @Req() req: any,
    @Param('id') id: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const conversation = await this.prisma.conversation.findFirst({
      where: { id, organizationId: req.organizationId },
    });
    if (!conversation) return { error: 'Conversation not found' };

    const p = parseInt(page || '1');
    const l = Math.min(parseInt(limit || '50'), 100);

    const [data, total] = await Promise.all([
      this.prisma.message.findMany({
        where: { conversationId: id },
        skip: (p - 1) * l,
        take: l,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.message.count({ where: { conversationId: id } }),
    ]);

    return { data, meta: { page: p, limit: l, total } };
  }

  // ============ DEALS ============

  @Get('deals')
  @ApiOperation({ summary: 'List deals' })
  async listDeals(
    @Req() req: any,
    @Query('status') status?: string,
    @Query('page') page?: string,
  ) {
    const p = parseInt(page || '1');
    const where: any = { organizationId: req.organizationId };
    if (status) where.status = status;

    const [data, total] = await Promise.all([
      this.prisma.deal.findMany({
        where,
        skip: (p - 1) * 50,
        take: 50,
        orderBy: { createdAt: 'desc' },
        include: {
          contact: { select: { id: true, name: true } },
          stage: { select: { id: true, name: true } },
        },
      }),
      this.prisma.deal.count({ where }),
    ]);

    return { data, meta: { page: p, limit: 50, total } };
  }

  @Post('deals')
  @ApiOperation({ summary: 'Create a deal' })
  async createDeal(@Req() req: any, @Body() body: {
    title: string;
    value?: number;
    contactId: string;
    stageId: string;
    pipelineId: string;
  }) {
    return this.prisma.deal.create({
      data: {
        title: body.title,
        value: body.value || 0,
        contactId: body.contactId,
        stageId: body.stageId,
        pipelineId: body.pipelineId,
        organizationId: req.organizationId,
      },
    });
  }
}
