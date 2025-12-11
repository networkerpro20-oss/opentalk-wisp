import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { TeamsService } from './teams.service';
import { CreateTeamDto } from './dto/create-team.dto';
import { UpdateTeamDto } from './dto/update-team.dto';
import { AddTeamMemberDto } from './dto/add-team-member.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Teams')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('teams')
export class TeamsController {
  constructor(private readonly teamsService: TeamsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new team' })
  create(@Request() req, @Body() createTeamDto: CreateTeamDto) {
    return this.teamsService.create(req.user.organizationId, createTeamDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all teams' })
  findAll(@Request() req) {
    return this.teamsService.findAll(req.user.organizationId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get team by ID' })
  findOne(@Request() req, @Param('id') id: string) {
    return this.teamsService.findOne(id, req.user.organizationId);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update team' })
  update(@Request() req, @Param('id') id: string, @Body() updateTeamDto: UpdateTeamDto) {
    return this.teamsService.update(id, req.user.organizationId, updateTeamDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete team' })
  remove(@Request() req, @Param('id') id: string) {
    return this.teamsService.remove(id, req.user.organizationId);
  }

  // ============================================
  // TEAM MEMBERS
  // ============================================

  @Post(':id/members')
  @ApiOperation({ summary: 'Add member to team' })
  addMember(@Request() req, @Param('id') id: string, @Body() addMemberDto: AddTeamMemberDto) {
    return this.teamsService.addMember(id, req.user.organizationId, addMemberDto);
  }

  @Delete(':id/members/:memberId')
  @ApiOperation({ summary: 'Remove member from team' })
  removeMember(@Request() req, @Param('id') id: string, @Param('memberId') memberId: string) {
    return this.teamsService.removeMember(id, req.user.organizationId, memberId);
  }

  @Patch(':id/members/:memberId')
  @ApiOperation({ summary: 'Update team member' })
  updateMember(
    @Request() req,
    @Param('id') id: string,
    @Param('memberId') memberId: string,
    @Body() updateData: Partial<AddTeamMemberDto>,
  ) {
    return this.teamsService.updateMember(id, req.user.organizationId, memberId, updateData);
  }

  @Get(':id/stats')
  @ApiOperation({ summary: 'Get team statistics' })
  getStats(@Request() req, @Param('id') id: string) {
    return this.teamsService.getTeamStats(id, req.user.organizationId);
  }
}
