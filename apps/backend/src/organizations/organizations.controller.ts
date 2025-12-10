import { Controller, Get, Patch, Body, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { OrganizationsService } from './organizations.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UpdateOrganizationDto } from './dto/update-organization.dto';

@ApiTags('Organizations')
@Controller('organizations')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class OrganizationsController {
  constructor(private readonly organizationsService: OrganizationsService) {}

  @Get('me')
  @ApiOperation({ summary: 'Get current organization' })
  async getMyOrganization(@Request() req) {
    return this.organizationsService.findByUser(req.user.id);
  }

  @Patch('me')
  @ApiOperation({ summary: 'Update current organization' })
  async updateMyOrganization(@Request() req, @Body() dto: UpdateOrganizationDto) {
    return this.organizationsService.update(req.user.organizationId, dto);
  }

  @Get('me/stats')
  @ApiOperation({ summary: 'Get organization statistics' })
  async getStats(@Request() req) {
    return this.organizationsService.getStats(req.user.organizationId);
  }
}
