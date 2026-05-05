import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { PrismaClient } from '@prisma/client';
import type { JwtPayload } from '../../../common/interfaces/jwt-payload.interface';
import { AuditService } from '../../audit/audit.service';
import { PrismaService } from '../../prisma/prisma.service';
import { PayPayrollDto, RunPayrollDto } from './dto/run-payroll.dto';

// Azerbaijan vergi qaydaları (2024)
const AZ_DSMF_EMPLOYEE_RATE = 0.03;
const AZ_DSMF_EMPLOYER_RATE = 0.22;
const AZ_INCOME_TAX_RATE = 0.14;
const AZ_INCOME_TAX_FREE_MINOR = 20000; // 200 AZN qəpik ilə

interface EmployeePayCalc {
  employeeId: string;
  grossMinor: number;
  dsmfEmployeeMinor: number;
  dsmfEmployerMinor: number;
  incomeTaxMinor: number;
  netMinor: number;
}

@Injectable()
export class PayrollService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  private calcEmployeePay(baseSalaryMinor: number): Omit<EmployeePayCalc, 'employeeId'> {
    const gross = baseSalaryMinor;
    const dsmfEmployee = Math.round(gross * AZ_DSMF_EMPLOYEE_RATE);
    const dsmfEmployer = Math.round(gross * AZ_DSMF_EMPLOYER_RATE);

    const taxableBase = gross - dsmfEmployee;
    const incomeTax =
      taxableBase <= AZ_INCOME_TAX_FREE_MINOR
        ? 0
        : Math.round((taxableBase - AZ_INCOME_TAX_FREE_MINOR) * AZ_INCOME_TAX_RATE);

    const net = gross - dsmfEmployee - incomeTax;

    return { grossMinor: gross, dsmfEmployeeMinor: dsmfEmployee, dsmfEmployerMinor: dsmfEmployer, incomeTaxMinor: incomeTax, netMinor: net };
  }

  private async buildJournalNumber(
    tx: Omit<PrismaClient, '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'>,
    accountId: string,
  ): Promise<string> {
    const count = await tx.journalEntry.count({ where: { accountId } });
    return `JE-${String(count + 1).padStart(6, '0')}`;
  }

  private async getAccAccount(
    tx: Omit<PrismaClient, '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'>,
    accountId: string,
    code: string,
  ) {
    const acc = await tx.accountingAccount.findFirst({
      where: { accountId, code, deletedAt: null },
      select: { id: true, name: true },
    });
    if (!acc) {
      throw new NotFoundException(
        `Mühasibat hesabı tapılmadı: ${code}. Əvvəlcə /hrm/seed-accounts endpoint-ini çağırın.`,
      );
    }
    return acc;
  }

  async generate(user: JwtPayload, dto: RunPayrollDto) {
    const periodStart = new Date(dto.periodStart);
    const periodEnd = new Date(dto.periodEnd);

    if (periodEnd < periodStart) {
      throw new BadRequestException('Bitiş tarixi başlanğıcdan əvvəl ola bilməz');
    }

    const existing = await this.prisma.payroll.findFirst({
      where: { accountId: user.accountId, periodStart, periodEnd },
    });
    if (existing) {
      throw new BadRequestException('Bu dövr üçün artıq payroll var');
    }

    const employees = await this.prisma.employee.findMany({
      where: { accountId: user.accountId, status: 'ACTIVE', deletedAt: null },
      select: { id: true, firstName: true, lastName: true, baseSalaryMinor: true },
    });

    if (employees.length === 0) {
      throw new BadRequestException('Aktiv işçi tapılmadı');
    }

    const calcs: EmployeePayCalc[] = employees.map((emp) => ({
      employeeId: emp.id,
      ...this.calcEmployeePay(emp.baseSalaryMinor),
    }));

    const totalGross = calcs.reduce((s, c) => s + c.grossMinor, 0);
    const totalDeductions = calcs.reduce(
      (s, c) => s + c.dsmfEmployeeMinor + c.incomeTaxMinor,
      0,
    );
    const totalNet = calcs.reduce((s, c) => s + c.netMinor, 0);

    const payroll = await this.prisma.payroll.create({
      data: {
        accountId: user.accountId,
        periodStart,
        periodEnd,
        totalGrossMinor: totalGross,
        totalDeductionsMinor: totalDeductions,
        totalNetMinor: totalNet,
        status: 'DRAFT',
        createdBy: user.sub,
        items: {
          create: calcs.flatMap((c) => [
            {
              accountId: user.accountId,
              employeeId: c.employeeId,
              type: 'EARNING',
              label: 'Əsas maaş',
              amountMinor: c.grossMinor,
            },
            {
              accountId: user.accountId,
              employeeId: c.employeeId,
              type: 'DEDUCTION',
              label: 'DSMF (işçi 3%)',
              amountMinor: c.dsmfEmployeeMinor,
            },
            {
              accountId: user.accountId,
              employeeId: c.employeeId,
              type: 'DEDUCTION',
              label: 'DSMF (işəgötürən 22%)',
              amountMinor: c.dsmfEmployerMinor,
            },
            {
              accountId: user.accountId,
              employeeId: c.employeeId,
              type: 'DEDUCTION',
              label: 'Gəlir vergisi (14%)',
              amountMinor: c.incomeTaxMinor,
            },
          ]),
        },
      },
      include: { items: true },
    });

    await this.audit.logAction({
      accountId: user.accountId,
      actorUserId: user.sub,
      action: 'hrm.payroll.generated',
      entityType: 'Payroll',
      entityId: payroll.id,
      metadata: {
        periodStart: dto.periodStart,
        periodEnd: dto.periodEnd,
        employeeCount: employees.length,
        totalGrossMinor: totalGross,
      },
    });

    return payroll;
  }

  async approve(user: JwtPayload, payrollId: string) {
    return this.prisma.$transaction(async (tx) => {
      const payroll = await tx.payroll.findFirst({
        where: { id: payrollId, accountId: user.accountId },
        include: { items: true },
      });
      if (!payroll) throw new NotFoundException('Payroll tapılmadı');
      if (payroll.status !== 'DRAFT') {
        throw new BadRequestException('Yalnız DRAFT payroll təsdiqlənə bilər');
      }

      const [salaryExpense, salaryPayable, dsmfPayable, taxPayable] =
        await Promise.all([
          this.getAccAccount(tx, user.accountId, '7100'),
          this.getAccAccount(tx, user.accountId, '5510'),
          this.getAccAccount(tx, user.accountId, '5520'),
          this.getAccAccount(tx, user.accountId, '5530'),
        ]);

      const totalDSMFEmployer = payroll.items
        .filter((i) => i.label.includes('işəgötürən'))
        .reduce((s, i) => s + i.amountMinor, 0);
      const totalDSMFEmployee = payroll.items
        .filter((i) => i.label.includes('işçi 3%'))
        .reduce((s, i) => s + i.amountMinor, 0);
      const totalIncomeTax = payroll.items
        .filter((i) => i.label.includes('Gəlir vergisi'))
        .reduce((s, i) => s + i.amountMinor, 0);

      const debitTotal = payroll.totalGrossMinor + totalDSMFEmployer;

      const journalNumber = await this.buildJournalNumber(tx, user.accountId);

      const journal = await tx.journalEntry.create({
        data: {
          accountId: user.accountId,
          journalNumber,
          entryDate: payroll.periodEnd,
          sourceType: 'PAYROLL',
          sourceId: payroll.id,
          reference: `Payroll ${payroll.periodStart.toISOString().slice(0, 7)}`,
          lines: {
            create: [
              {
                accountingAccountId: salaryExpense.id,
                debitMinor: debitTotal,
                creditMinor: 0,
                description: 'Əməkhaqqı xərcləri',
              },
              {
                accountingAccountId: salaryPayable.id,
                debitMinor: 0,
                creditMinor: payroll.totalNetMinor,
                description: 'Ödəniləcək xalis maaş',
              },
              {
                accountingAccountId: dsmfPayable.id,
                debitMinor: 0,
                creditMinor: totalDSMFEmployee + totalDSMFEmployer,
                description: 'DSMF ödəniləcəklər',
              },
              {
                accountingAccountId: taxPayable.id,
                debitMinor: 0,
                creditMinor: totalIncomeTax,
                description: 'Gəlir vergisi ödəniləcəklər',
              },
            ],
          },
        },
      });

      const updated = await tx.payroll.update({
        where: { id: payrollId },
        data: {
          status: 'APPROVED',
          journalEntryId: journal.id,
          approvedBy: user.sub,
          approvedAt: new Date(),
        },
      });

      await this.audit.logAction({
        accountId: user.accountId,
        actorUserId: user.sub,
        action: 'hrm.payroll.approved',
        entityType: 'Payroll',
        entityId: payrollId,
        metadata: { journalEntryId: journal.id, journalNumber },
      });

      return updated;
    });
  }

  async pay(user: JwtPayload, payrollId: string, dto: PayPayrollDto) {
    return this.prisma.$transaction(async (tx) => {
      const payroll = await tx.payroll.findFirst({
        where: { id: payrollId, accountId: user.accountId },
      });
      if (!payroll) throw new NotFoundException('Payroll tapılmadı');
      if (payroll.status !== 'APPROVED') {
        throw new BadRequestException('Yalnız APPROVED payroll ödənilə bilər');
      }

      const bankAccount = await tx.bankAccount.findFirst({
        where: { id: dto.bankAccountId, accountId: user.accountId, deletedAt: null },
        select: { id: true, balanceMinor: true, name: true },
      });
      if (!bankAccount) throw new NotFoundException('Bank hesabı tapılmadı');
      if (bankAccount.balanceMinor < payroll.totalNetMinor) {
        throw new BadRequestException('Bank hesabında kifayət qədər vəsait yoxdur');
      }

      const salaryPayable = await this.getAccAccount(tx, user.accountId, '5510');
      const journalNumber = await this.buildJournalNumber(tx, user.accountId);

      const bankAccounting = await tx.accountingAccount.findFirst({
        where: { accountId: user.accountId, name: { contains: bankAccount.name, mode: 'insensitive' }, deletedAt: null },
        select: { id: true },
      });

      if (bankAccounting) {
        await tx.journalEntry.create({
          data: {
            accountId: user.accountId,
            journalNumber,
            entryDate: new Date(),
            sourceType: 'PAYROLL_PAYMENT',
            sourceId: payroll.id,
            reference: `Payroll ödənişi ${payroll.periodStart.toISOString().slice(0, 7)}`,
            lines: {
              create: [
                {
                  accountingAccountId: salaryPayable.id,
                  debitMinor: payroll.totalNetMinor,
                  creditMinor: 0,
                  description: 'Maaş öhdəliyinin bağlanması',
                },
                {
                  accountingAccountId: bankAccounting.id,
                  debitMinor: 0,
                  creditMinor: payroll.totalNetMinor,
                  description: 'Bank-dan maaş ödənişi',
                },
              ],
            },
          },
        });
      }

      await tx.bankTransaction.create({
        data: {
          accountId: user.accountId,
          bankAccountId: dto.bankAccountId,
          type: 'OUTFLOW',
          amountMinor: payroll.totalNetMinor,
          description: `Əməkhaqqı ödənişi — ${payroll.periodStart.toISOString().slice(0, 7)}`,
          reference: payroll.id,
          transactionDate: new Date(),
        },
      });

      await tx.bankAccount.update({
        where: { id: dto.bankAccountId },
        data: { balanceMinor: { decrement: payroll.totalNetMinor } },
      });

      const updated = await tx.payroll.update({
        where: { id: payrollId },
        data: {
          status: 'PAID',
          paidAt: new Date(),
          paymentBankAccountId: dto.bankAccountId,
        },
      });

      await this.audit.logAction({
        accountId: user.accountId,
        actorUserId: user.sub,
        action: 'hrm.payroll.paid',
        entityType: 'Payroll',
        entityId: payrollId,
        metadata: {
          bankAccountId: dto.bankAccountId,
          totalNetMinor: payroll.totalNetMinor,
        },
      });

      return updated;
    });
  }

  findAll(user: JwtPayload) {
    return this.prisma.payroll.findMany({
      where: { accountId: user.accountId },
      include: {
        _count: { select: { items: true } },
      },
      orderBy: { periodStart: 'desc' },
    });
  }

  async findOne(user: JwtPayload, id: string) {
    const payroll = await this.prisma.payroll.findFirst({
      where: { id, accountId: user.accountId },
      include: {
        items: {
          include: {
            employee: { select: { id: true, firstName: true, lastName: true, employeeCode: true } },
          },
          orderBy: [{ employeeId: 'asc' }, { type: 'asc' }],
        },
      },
    });
    if (!payroll) throw new NotFoundException('Payroll tapılmadı');
    return payroll;
  }

  async seedAccounts(user: JwtPayload) {
    const defs = [
      { code: '7100', name: 'Əməkhaqqı xərcləri', type: 'Xərc' },
      { code: '5510', name: 'Ödəniləcək əməkhaqqı', type: 'Passiv' },
      { code: '5520', name: 'DSMF ödəniləcəklər', type: 'Passiv' },
      { code: '5530', name: 'Gəlir vergisi ödəniləcəklər', type: 'Passiv' },
    ];

    const results: Array<{ code: string; created: boolean; id: string }> = [];

    for (const def of defs) {
      const existing = await this.prisma.accountingAccount.findFirst({
        where: { accountId: user.accountId, code: def.code, deletedAt: null },
        select: { id: true },
      });

      if (existing) {
        results.push({ code: def.code, created: false, id: existing.id });
      } else {
        const created = await this.prisma.accountingAccount.create({
          data: { accountId: user.accountId, ...def },
          select: { id: true },
        });
        results.push({ code: def.code, created: true, id: created.id });
      }
    }

    return { total: results.length, results };
  }
}
