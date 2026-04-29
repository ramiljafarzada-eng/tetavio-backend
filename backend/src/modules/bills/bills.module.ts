import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { AuditModule } from '../audit/audit.module';
import { BillsController } from './bills.controller';
import { BillsService } from './bills.service';

@Module({
  imports: [PrismaModule, AuditModule],
  controllers: [BillsController],
  providers: [BillsService],
})
export class BillsModule {}
