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
import { MessagesService } from './messages.service';
import { CreateMessageDto } from './dto/create-message.dto';
import { UpdateMessageDto } from './dto/update-message.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Messages')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('messages')
export class MessagesController {
  constructor(private readonly messagesService: MessagesService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new message' })
  create(@Req() req: any, @Body() createMessageDto: CreateMessageDto) {
    return this.messagesService.create(
      req.user.organizationId,
      req.user.sub,
      createMessageDto,
    );
  }

  @Get()
  @ApiOperation({ summary: 'Get all messages with filters' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'conversationId', required: false, type: String })
  @ApiQuery({ name: 'contactId', required: false, type: String })
  findAll(
    @Req() req: any,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('conversationId') conversationId?: string,
    @Query('contactId') contactId?: string,
  ) {
    const pageNum = page ? parseInt(page, 10) : 1;
    const limitNum = limit ? parseInt(limit, 10) : 50;
    const skip = (pageNum - 1) * limitNum;

    return this.messagesService.findAll(req.user.organizationId, {
      skip,
      take: limitNum,
      conversationId,
      contactId,
    });
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get messages statistics' })
  getStats(@Req() req: any) {
    return this.messagesService.getStats(req.user.organizationId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a message by ID' })
  findOne(@Req() req: any, @Param('id') id: string) {
    return this.messagesService.findOne(req.user.organizationId, id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a message' })
  update(
    @Req() req: any,
    @Param('id') id: string,
    @Body() updateMessageDto: UpdateMessageDto,
  ) {
    return this.messagesService.update(
      req.user.organizationId,
      id,
      updateMessageDto,
    );
  }

  @Patch(':id/read')
  @ApiOperation({ summary: 'Mark message as read' })
  markAsRead(@Req() req: any, @Param('id') id: string) {
    return this.messagesService.markAsRead(req.user.organizationId, id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a message' })
  remove(@Req() req: any, @Param('id') id: string) {
    return this.messagesService.remove(req.user.organizationId, id);
  }
}
