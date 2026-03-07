import { Controller, Get, Post, Delete, Body, Param, Req, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ApiKeyService } from './api-key.service';

@ApiTags('API Keys')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('api-keys')
export class ApiKeyController {
  constructor(private readonly apiKeyService: ApiKeyService) {}

  @Post()
  @ApiOperation({ summary: 'Generate a new API key' })
  generate(@Req() req: any, @Body() body: { name: string; permissions: string[] }) {
    return this.apiKeyService.generate(req.user.organizationId, body.name, body.permissions);
  }

  @Get()
  @ApiOperation({ summary: 'List all API keys (without secrets)' })
  list(@Req() req: any) {
    return this.apiKeyService.list(req.user.organizationId);
  }

  @Post(':id/revoke')
  @ApiOperation({ summary: 'Revoke an API key' })
  revoke(@Req() req: any, @Param('id') id: string) {
    return this.apiKeyService.revoke(id, req.user.organizationId);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete an API key' })
  remove(@Req() req: any, @Param('id') id: string) {
    return this.apiKeyService.delete(id, req.user.organizationId);
  }
}
