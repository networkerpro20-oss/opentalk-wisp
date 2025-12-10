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
import { ContactsService } from './contacts.service';
import { CreateContactDto } from './dto/create-contact.dto';
import { UpdateContactDto } from './dto/update-contact.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Contacts')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('contacts')
export class ContactsController {
  constructor(private readonly contactsService: ContactsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new contact' })
  create(@Req() req: any, @Body() createContactDto: CreateContactDto) {
    return this.contactsService.create(
      req.user.organizationId,
      createContactDto,
    );
  }

  @Get()
  @ApiOperation({ summary: 'Get all contacts with pagination and search' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'search', required: false, type: String })
  findAll(
    @Req() req: any,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
  ) {
    const pageNum = page ? parseInt(page, 10) : 1;
    const limitNum = limit ? parseInt(limit, 10) : 20;
    const skip = (pageNum - 1) * limitNum;

    return this.contactsService.findAll(req.user.organizationId, {
      skip,
      take: limitNum,
      search,
    });
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get contacts statistics' })
  getStats(@Req() req: any) {
    return this.contactsService.getStats(req.user.organizationId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a contact by ID' })
  findOne(@Req() req: any, @Param('id') id: string) {
    return this.contactsService.findOne(req.user.organizationId, id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a contact' })
  update(
    @Req() req: any,
    @Param('id') id: string,
    @Body() updateContactDto: UpdateContactDto,
  ) {
    return this.contactsService.update(
      req.user.organizationId,
      id,
      updateContactDto,
    );
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a contact' })
  remove(@Req() req: any, @Param('id') id: string) {
    return this.contactsService.remove(req.user.organizationId, id);
  }
}
