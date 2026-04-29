import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { AuditModule } from '../audit/audit.module';
import { BankingController } from './banking.controller';
import { BankingService } from './banking.service';

@Module({
  imports: [PrismaModule, AuditModule],
  controllers: [BankingController],
  providers: [BankingService],
})
export class BankingModule {}
