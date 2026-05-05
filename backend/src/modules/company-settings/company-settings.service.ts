import { Injectable } from '@nestjs/common';
import type { JwtPayload } from '../../common/interfaces/jwt-payload.interface';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateCompanySettingsDto } from './dto/update-company-settings.dto';

@Injectable()
export class CompanySettingsService {
  constructor(private readonly prisma: PrismaService) {}

  async getMySettings(user: JwtPayload) {
    const account = await this.prisma.account.findUniqueOrThrow({
      where: { id: user.accountId },
      include: {
        companyProfile: true,
      },
    });

    if (account.companyProfile) {
      return account.companyProfile;
    }

    return {
      id: null,
      accountId: account.id,
      companyName: account.name,
      taxId: null,
      mobilePhone: null,
      entityType: 'Huquqi sexs',
      currency: 'AZN',
      fiscalYear: null,
      invoicePrefix: null,
      quotePrefix: null,
      defaultPaymentTerm: null,
      defaultTaxLabel: null,
      numberingMode: null,
      stockWarning: null,
      negativeStock: null,
      discountMode: null,
      discountTiming: null,
      additionalAdjustment: null,
      shippingCharge: null,
      taxMode: null,
      salesRoundingMode: null,
      salespersonField: null,
      createdAt: null,
      updatedAt: null,
    };
  }

  async upsertMySettings(user: JwtPayload, dto: UpdateCompanySettingsDto) {
    const account = await this.prisma.account.findUniqueOrThrow({
      where: { id: user.accountId },
      select: {
        id: true,
        name: true,
      },
    });

    return this.prisma.companyProfile.upsert({
      where: { accountId: user.accountId },
      create: {
        accountId: user.accountId,
        companyName: dto.companyName ?? account.name,
        taxId: dto.taxId ?? null,
        mobilePhone: dto.mobilePhone ?? null,
        entityType: dto.entityType ?? 'Huquqi sexs',
        currency: dto.currency ?? 'AZN',
        fiscalYear: dto.fiscalYear ?? null,
        invoicePrefix: dto.invoicePrefix ?? null,
        quotePrefix: dto.quotePrefix ?? null,
        defaultPaymentTerm: dto.defaultPaymentTerm ?? null,
        defaultTaxLabel: dto.defaultTaxLabel ?? null,
        numberingMode: dto.numberingMode ?? null,
        stockWarning: dto.stockWarning ?? null,
        negativeStock: dto.negativeStock ?? null,
        discountMode: dto.discountMode ?? null,
        discountTiming: dto.discountTiming ?? null,
        additionalAdjustment: dto.additionalAdjustment ?? null,
        shippingCharge: dto.shippingCharge ?? null,
        taxMode: dto.taxMode ?? null,
        salesRoundingMode: dto.salesRoundingMode ?? null,
        salespersonField: dto.salespersonField ?? null,
      },
      update: {
        ...(dto.companyName !== undefined ? { companyName: dto.companyName } : {}),
        ...(dto.taxId !== undefined ? { taxId: dto.taxId } : {}),
        ...(dto.mobilePhone !== undefined ? { mobilePhone: dto.mobilePhone } : {}),
        ...(dto.entityType !== undefined ? { entityType: dto.entityType } : {}),
        ...(dto.currency !== undefined ? { currency: dto.currency } : {}),
        ...(dto.fiscalYear !== undefined ? { fiscalYear: dto.fiscalYear } : {}),
        ...(dto.invoicePrefix !== undefined ? { invoicePrefix: dto.invoicePrefix } : {}),
        ...(dto.quotePrefix !== undefined ? { quotePrefix: dto.quotePrefix } : {}),
        ...(dto.defaultPaymentTerm !== undefined ? { defaultPaymentTerm: dto.defaultPaymentTerm } : {}),
        ...(dto.defaultTaxLabel !== undefined ? { defaultTaxLabel: dto.defaultTaxLabel } : {}),
        ...(dto.numberingMode !== undefined ? { numberingMode: dto.numberingMode } : {}),
        ...(dto.stockWarning !== undefined ? { stockWarning: dto.stockWarning } : {}),
        ...(dto.negativeStock !== undefined ? { negativeStock: dto.negativeStock } : {}),
        ...(dto.discountMode !== undefined ? { discountMode: dto.discountMode } : {}),
        ...(dto.discountTiming !== undefined ? { discountTiming: dto.discountTiming } : {}),
        ...(dto.additionalAdjustment !== undefined ? { additionalAdjustment: dto.additionalAdjustment } : {}),
        ...(dto.shippingCharge !== undefined ? { shippingCharge: dto.shippingCharge } : {}),
        ...(dto.taxMode !== undefined ? { taxMode: dto.taxMode } : {}),
        ...(dto.salesRoundingMode !== undefined ? { salesRoundingMode: dto.salesRoundingMode } : {}),
        ...(dto.salespersonField !== undefined ? { salespersonField: dto.salespersonField } : {}),
      },
    });
  }
}
