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
import { ConversationsService } from './conversations.service';
import { CreateConversationDto } from './dto/create-conversation.dto';
import { UpdateConversationDto } from './dto/update-conversation.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ConversationStatus, ConversationDisposition } from '@prisma/client';

@ApiTags('Conversations')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('conversations')
export class ConversationsController {
  constructor(
    private readonly conversationsService: ConversationsService,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Create a new conversation' })
  create(@Req() req: any, @Body() createConversationDto: CreateConversationDto) {
    return this.conversationsService.create(
      req.user.organizationId,
      createConversationDto,
    );
  }

  @Get()
  @ApiOperation({ summary: 'Get all conversations with filters' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'status', required: false, enum: ConversationStatus })
  @ApiQuery({ name: 'assignedToId', required: false, type: String })
  @ApiQuery({ name: 'contactId', required: false, type: String })
  @ApiQuery({ name: 'disposition', required: false, enum: ConversationDisposition })
  findAll(
    @Req() req: any,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('status') status?: ConversationStatus,
    @Query('assignedToId') assignedToId?: string,
    @Query('contactId') contactId?: string,
    @Query('disposition') disposition?: ConversationDisposition,
  ) {
    const pageNum = page ? parseInt(page, 10) : 1;
    const limitNum = limit ? parseInt(limit, 10) : 20;
    const skip = (pageNum - 1) * limitNum;

    return this.conversationsService.findAll(req.user.organizationId, {
      skip,
      take: limitNum,
      status,
      disposition,
      assignedToId,
      contactId,
    });
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get conversations statistics' })
  getStats(@Req() req: any) {
    return this.conversationsService.getStats(req.user.organizationId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a conversation by ID with all messages' })
  findOne(@Req() req: any, @Param('id') id: string) {
    return this.conversationsService.findOne(req.user.organizationId, id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a conversation' })
  update(
    @Req() req: any,
    @Param('id') id: string,
    @Body() updateConversationDto: UpdateConversationDto,
  ) {
    return this.conversationsService.update(
      req.user.organizationId,
      id,
      updateConversationDto,
      req.user.id,
    );
  }

  @Patch(':id/assign/:userId')
  @ApiOperation({ summary: 'Assign conversation to a user' })
  assignToUser(
    @Req() req: any,
    @Param('id') id: string,
    @Param('userId') userId: string,
  ) {
    return this.conversationsService.assignToUser(
      req.user.organizationId,
      id,
      userId,
    );
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a conversation' })
  remove(@Req() req: any, @Param('id') id: string) {
    return this.conversationsService.remove(req.user.organizationId, id);
  }
}
