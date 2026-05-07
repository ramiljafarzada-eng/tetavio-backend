import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  ParseIntPipe,
  ParseUUIDPipe,
  Patch,
  Post,
  Put,
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
import { AttendanceService } from './attendance.service';
import { CheckInDto, CheckOutDto } from './dto/check-in.dto';
import { ListAttendanceQueryDto, ManualAttendanceDto } from './dto/manual-attendance.dto';

@ApiTags('HRM - Attendance')
@ApiBearerAuth()
@Controller('hrm/attendance')
@UseGuards(JwtAuthGuard, HrmScopeGuard)
export class AttendanceController {
  constructor(private readonly service: AttendanceService) {}

  @Post('check-in')
  @HrmScopes('SELF_ONLY', 'DEPT_ONLY', 'ACCOUNT_ALL')
  checkIn(@Body() dto: CheckInDto, @CurrentUser() user: JwtPayload) {
    return this.service.checkIn(user, dto);
  }

  @Put('check-out')
  @HrmScopes('SELF_ONLY', 'DEPT_ONLY', 'ACCOUNT_ALL')
  checkOut(@Body() dto: CheckOutDto, @CurrentUser() user: JwtPayload) {
    return this.service.checkOut(user, dto);
  }

  @Post('manual')
  @HrmScopes('DEPT_ONLY', 'ACCOUNT_ALL')
  manual(@Body() dto: ManualAttendanceDto, @CurrentUser() user: JwtPayload) {
    return this.service.manualEntry(user, dto);
  }

  @Get()
  @HrmScopes('SELF_ONLY', 'DEPT_ONLY', 'ACCOUNT_ALL')
  findAll(
    @Req() req: HrmRequestContext,
    @CurrentUser() user: JwtPayload,
    @Query() query: ListAttendanceQueryDto,
  ) {
    return this.service.findAll(user, req, query);
  }

  @Patch(':id')
  @HrmScopes('DEPT_ONLY', 'ACCOUNT_ALL')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ManualAttendanceDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.service.updateById(user, id, dto);
  }

  @Delete(':id')
  @HttpCode(204)
  @HrmScopes('DEPT_ONLY', 'ACCOUNT_ALL')
  remove(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: JwtPayload) {
    return this.service.deleteById(user, id);
  }

  @Get('monthly/:employeeId/:year/:month')
  @HrmScopes('SELF_ONLY', 'DEPT_ONLY', 'ACCOUNT_ALL')
  monthlyReport(
    @Param('employeeId', ParseUUIDPipe) employeeId: string,
    @Param('year', ParseIntPipe) year: number,
    @Param('month', ParseIntPipe) month: number,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.service.getMonthlyReport(user, employeeId, year, month);
  }
}
