import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, ParseUUIDPipe, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import type { JwtPayload } from '../../../common/interfaces/jwt-payload.interface';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { HrmScopes } from '../guards/hrm-scope.decorator';
import { HrmScopeGuard } from '../guards/hrm-scope.guard';
import { CreatePositionDto } from './dto/create-position.dto';
import { PositionsService } from './positions.service';

@ApiTags('HRM - Positions')
@ApiBearerAuth()
@Controller('hrm/positions')
@UseGuards(JwtAuthGuard, HrmScopeGuard)
export class PositionsController {
  constructor(private readonly service: PositionsService) {}

  @Post()
  @HrmScopes('ACCOUNT_ALL')
  create(@Body() dto: CreatePositionDto, @CurrentUser() user: JwtPayload) {
    return this.service.create(user, dto);
  }

  @Get()
  @HrmScopes('SELF_ONLY', 'DEPT_ONLY', 'ACCOUNT_ALL')
  findAll(@CurrentUser() user: JwtPayload) {
    return this.service.findAll(user);
  }

  @Patch(':id')
  @HrmScopes('ACCOUNT_ALL')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CreatePositionDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.service.update(user, id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @HrmScopes('ACCOUNT_ALL')
  remove(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: JwtPayload) {
    return this.service.remove(user, id);
  }
}
