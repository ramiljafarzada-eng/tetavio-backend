import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { AttendanceModule } from './attendance/attendance.module';
import { DepartmentsModule } from './departments/departments.module';
import { EmployeesModule } from './employees/employees.module';
import { LeaveModule } from './leave/leave.module';
import { PayrollModule } from './payroll/payroll.module';

@Module({
  imports: [
    PrismaModule,
    EmployeesModule,
    DepartmentsModule,
    AttendanceModule,
    LeaveModule,
    PayrollModule,
  ],
})
export class HrmModule {}
