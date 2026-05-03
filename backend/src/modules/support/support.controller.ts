import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import type { JwtPayload } from '../../common/interfaces/jwt-payload.interface';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateSupportThreadDto } from './dto/create-support-thread.dto';
import { ListSupportThreadsQueryDto } from './dto/list-support-threads-query.dto';
import { ReplySupportMessageDto } from './dto/reply-support-message.dto';
import { UpdateSupportThreadStatusDto } from './dto/update-support-thread-status.dto';
import { SupportService } from './support.service';

@ApiTags('support')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard)
@Controller()
export class SupportController {
  constructor(private readonly supportService: SupportService) {}

  @Get('support/threads')
  @ApiOperation({ summary: 'List support threads for the current account' })
  listMine(@CurrentUser() user: JwtPayload) {
    return this.supportService.listMine(user);
  }

  @Post('support/threads')
  @ApiOperation({ summary: 'Create a new support thread for the current account' })
  @ApiBody({ type: CreateSupportThreadDto })
  createMine(@CurrentUser() user: JwtPayload, @Body() dto: CreateSupportThreadDto) {
    return this.supportService.create(user, dto);
  }

  @Get('support/threads/:id')
  @ApiOperation({ summary: 'Get a support thread belonging to the current account' })
  getMine(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.supportService.getMine(user, id);
  }

  @Post('support/threads/:id/messages')
  @ApiOperation({ summary: 'Add a message to a support thread as the current account' })
  @ApiBody({ type: ReplySupportMessageDto })
  replyMine(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body() dto: ReplySupportMessageDto,
  ) {
    return this.supportService.replyMine(user, id, dto);
  }

  @Patch('support/threads/:id/status')
  @ApiOperation({ summary: 'Update the current account thread status' })
  @ApiBody({ type: UpdateSupportThreadStatusDto })
  updateMine(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body() dto: UpdateSupportThreadStatusDto,
  ) {
    return this.supportService.updateMine(user, id, dto);
  }

  @Get('internal/support/threads')
  @UseGuards(RolesGuard)
  @Roles('SUPER_ADMIN')
  @ApiOperation({ summary: 'Paginated support inbox for super admins' })
  listInternal(@CurrentUser() user: JwtPayload, @Query() query: ListSupportThreadsQueryDto) {
    return this.supportService.listInternal(user, query);
  }

  @Get('internal/support/threads/:id')
  @UseGuards(RolesGuard)
  @Roles('SUPER_ADMIN')
  @ApiOperation({ summary: 'Get a support thread for super admins' })
  getInternal(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.supportService.getInternal(user, id);
  }

  @Post('internal/support/threads/:id/messages')
  @UseGuards(RolesGuard)
  @Roles('SUPER_ADMIN')
  @ApiOperation({ summary: 'Reply to a support thread as super admin' })
  @ApiBody({ type: ReplySupportMessageDto })
  replyInternal(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body() dto: ReplySupportMessageDto,
  ) {
    return this.supportService.replyInternal(user, id, dto);
  }

  @Patch('internal/support/threads/:id/status')
  @UseGuards(RolesGuard)
  @Roles('SUPER_ADMIN')
  @ApiOperation({ summary: 'Update a support thread status as super admin' })
  @ApiBody({ type: UpdateSupportThreadStatusDto })
  updateInternal(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body() dto: UpdateSupportThreadStatusDto,
  ) {
    return this.supportService.updateInternal(user, id, dto);
  }
}
