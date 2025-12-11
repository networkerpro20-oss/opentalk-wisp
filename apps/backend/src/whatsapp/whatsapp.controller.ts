import {
  Controller,
  Get,
  Post,
  Body,
  Delete,
  UseGuards,
  Req,
  Param,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { WhatsappService } from './whatsapp.service';
import { CreateWhatsAppInstanceDto } from './dto/create-whatsapp-instance.dto';
import { SendMessageDto } from './dto/send-message.dto';
import { SendMediaDto } from './dto/send-media.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('WhatsApp')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('whatsapp')
export class WhatsappController {
  constructor(private readonly whatsappService: WhatsappService) {}

  @Post('instances')
  @ApiOperation({ summary: 'Create a new WhatsApp instance' })
  createInstance(
    @Req() req: any,
    @Body() createDto: CreateWhatsAppInstanceDto,
  ) {
    return this.whatsappService.createInstance(req.user.organizationId, createDto);
  }

  @Get('instances')
  @ApiOperation({ summary: 'Get all WhatsApp instances' })
  getInstances(@Req() req: any) {
    return this.whatsappService.getInstances(req.user.organizationId);
  }

  @Get('instances/:id')
  @ApiOperation({ summary: 'Get a WhatsApp instance by ID' })
  getInstance(@Req() req: any, @Param('id') id: string) {
    return this.whatsappService.getInstance(req.user.organizationId, id);
  }

  @Get('instances/:id/qr')
  @ApiOperation({ summary: 'Get QR code for WhatsApp instance' })
  getQRCode(@Req() req: any, @Param('id') id: string) {
    return this.whatsappService.getQRCode(req.user.organizationId, id);
  }

  @Get('health')
  @ApiOperation({ summary: 'Check WhatsApp service health' })
  getHealth() {
    return this.whatsappService.getServiceHealth();
  }

  @Delete('instances/:id')
  @ApiOperation({ summary: 'Delete a WhatsApp instance' })
  deleteInstance(@Req() req: any, @Param('id') id: string) {
    return this.whatsappService.deleteInstance(req.user.organizationId, id);
  }

  @Post('send')
  @ApiOperation({ summary: 'Send a WhatsApp message' })
  sendMessage(@Req() req: any, @Body() sendDto: SendMessageDto) {
    return this.whatsappService.sendMessage(req.user.organizationId, sendDto);
  }

  @Post('send-media')
  @ApiOperation({ summary: 'Send WhatsApp media (image, video, audio, document)' })
  sendMedia(@Req() req: any, @Body() sendDto: SendMediaDto) {
    return this.whatsappService.sendMedia(req.user.organizationId, sendDto);
  }
}
