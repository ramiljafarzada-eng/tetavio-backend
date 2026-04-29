import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { JwtPayload } from '../../common/interfaces/jwt-payload.interface';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateTeamMemberDto } from './dto/create-team-member.dto';
import { UpdateTeamMemberDto } from './dto/update-team-member.dto';
import { TeamService } from './team.service';

@ApiTags('Team')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard)
@Controller('team')
export class TeamController {
  constructor(private readonly teamService: TeamService) {}

  @Get()
  @ApiOperation({ summary: 'List team members for authenticated account' })
  list(@CurrentUser() user: JwtPayload) {
    return this.teamService.list(user);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new team member for authenticated account (OWNER/ADMIN only)' })
  @ApiBody({ type: CreateTeamMemberDto })
  create(@CurrentUser() user: JwtPayload, @Body() dto: CreateTeamMemberDto) {
    return this.teamService.create(user, dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update team member role or active status (OWNER/ADMIN only)' })
  @ApiBody({ type: UpdateTeamMemberDto })
  update(
    @CurrentUser() user: JwtPayload,
    @Param('id', new ParseUUIDPipe()) memberId: string,
    @Body() dto: UpdateTeamMemberDto,
  ) {
    return this.teamService.update(user, memberId, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Deactivate a team member (OWNER/ADMIN only)' })
  deactivate(
    @CurrentUser() user: JwtPayload,
    @Param('id', new ParseUUIDPipe()) memberId: string,
  ) {
    return this.teamService.deactivate(user, memberId);
  }
}
