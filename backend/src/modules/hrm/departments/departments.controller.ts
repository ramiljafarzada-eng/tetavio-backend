import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import type { JwtPayload } from '../../../common/interfaces/jwt-payload.interface';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { HrmScopes } from '../guards/hrm-scope.decorator';
import { HrmScopeGuard } from '../guards/hrm-scope.guard';
import { CreateDepartmentDto } from './dto/create-department.dto';
import { UpdateDepartmentDto } from './dto/update-department.dto';
import { DepartmentsService } from './departments.service';

@ApiTags('HRM - Departments')
@ApiBearerAuth()
@Controller('hrm/departments')
@UseGuards(JwtAuthGuard, HrmScopeGuard)
export class DepartmentsController {
  constructor(private readonly service: DepartmentsService) {}

  @Post()
  @HrmScopes('ACCOUNT_ALL')
  create(@Body() dto: CreateDepartmentDto, @CurrentUser() user: JwtPayload) {
    return this.service.create(user, dto);
  }

  @Get()
  @HrmScopes('DEPT_ONLY', 'ACCOUNT_ALL')
  findAll(@CurrentUser() user: JwtPayload) {
    return this.service.findAll(user);
  }

  @Get(':id')
  @HrmScopes('DEPT_ONLY', 'ACCOUNT_ALL')
  findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.service.findOne(user, id);
  }

  @Patch(':id')
  @HrmScopes('ACCOUNT_ALL')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateDepartmentDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.service.update(user, id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @HrmScopes('ACCOUNT_ALL')
  remove(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.service.remove(user, id);
  }
}
