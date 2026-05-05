import { Module } from '@nestjs/common';
import { AuditModule } from '../../audit/audit.module';
import { PrismaModule } from '../../prisma/prisma.module';
import { AttendanceController } from './attendance.controller';
import { AttendanceEngineService } from './attendance-engine.service';
import { AttendanceService } from './attendance.service';

@Module({
  imports: [PrismaModule, AuditModule],
  controllers: [AttendanceController],
  providers: [AttendanceService, AttendanceEngineService],
  exports: [AttendanceService, AttendanceEngineService],
})
export class AttendanceModule {}
