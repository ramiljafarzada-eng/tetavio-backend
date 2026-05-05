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
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import type { JwtPayload } from '../../../common/interfaces/jwt-payload.interface';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { HrmScopes } from '../guards/hrm-scope.decorator';
import type { HrmRequestContext } from '../guards/hrm-scope.guard';
import { HrmScopeGuard } from '../guards/hrm-scope.guard';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { ListEmployeesQueryDto } from './dto/list-employees-query.dto';
import { UpdateEmployeeDto } from './dto/update-employee.dto';
import { EmployeesService } from './employees.service';

@ApiTags('HRM - Employees')
@ApiBearerAuth()
@Controller('hrm/employees')
@UseGuards(JwtAuthGuard, HrmScopeGuard)
export class EmployeesController {
  constructor(private readonly service: EmployeesService) {}

  @Post()
  @HrmScopes('ACCOUNT_ALL')
  create(
    @Body() dto: CreateEmployeeDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.service.create(user, dto);
  }

  @Get()
  @HrmScopes('SELF_ONLY', 'DEPT_ONLY', 'ACCOUNT_ALL')
  findAll(
    @Req() req: HrmRequestContext,
    @CurrentUser() user: JwtPayload,
    @Query() query: ListEmployeesQueryDto,
  ) {
    return this.service.findAll(user, req, query);
  }

  @Get(':id')
  @HrmScopes('SELF_ONLY', 'DEPT_ONLY', 'ACCOUNT_ALL')
  findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() req: HrmRequestContext,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.service.findOne(user, id, req);
  }

  @Patch(':id')
  @HrmScopes('ACCOUNT_ALL')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateEmployeeDto,
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
