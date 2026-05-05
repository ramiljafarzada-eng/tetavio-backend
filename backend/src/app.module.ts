import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { AppController } from './app.controller';
import { AuthModule } from './modules/auth/auth.module';
import { CompanySettingsModule } from './modules/company-settings/company-settings.module';
import { CustomersModule } from './modules/customers/customers.module';
import { InvoicesModule } from './modules/invoices/invoices.module';
import { OrdersModule } from './modules/orders/orders.module';
import { PaymentsModule } from './modules/payments/payments.module';
import { PlansModule } from './modules/plans/plans.module';
import { PrismaModule } from './modules/prisma/prisma.module';
import { SubscriptionsModule } from './modules/subscriptions/subscriptions.module';
import { VendorsModule } from './modules/vendors/vendors.module';
import { AdminModule } from './admin/admin.module';
import { InsightsModule } from './modules/insights/insights.module';
import { AccountingModule } from './modules/accounting/accounting.module';
import { ReportsModule } from './modules/reports/reports.module';
import { TeamModule } from './modules/team/team.module';
import { BillsModule } from './modules/bills/bills.module';
import { BankingModule } from './modules/banking/banking.module';
import { SupportModule } from './modules/support/support.module';
import { HrmModule } from './modules/hrm/hrm.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ThrottlerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const ttl = Number(configService.get<string>('THROTTLE_TTL_MS', '60000'));
        const limit = Number(configService.get<string>('THROTTLE_LIMIT', '100'));

        return [
          {
            ttl,
            limit,
          },
        ];
      },
    }),
    PrismaModule,
    AuthModule,
    PlansModule,
    SubscriptionsModule,
    OrdersModule,
    PaymentsModule,
    CompanySettingsModule,
    CustomersModule,
    VendorsModule,
    InvoicesModule,
    AdminModule,
    InsightsModule,
    AccountingModule,
    ReportsModule,
    TeamModule,
    BillsModule,
    BankingModule,
    SupportModule,
    HrmModule,
  ],
  controllers: [AppController],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
