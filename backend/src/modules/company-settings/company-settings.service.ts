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
      },
      update: {
        ...(dto.companyName !== undefined ? { companyName: dto.companyName } : {}),
        ...(dto.taxId !== undefined ? { taxId: dto.taxId } : {}),
        ...(dto.mobilePhone !== undefined ? { mobilePhone: dto.mobilePhone } : {}),
        ...(dto.entityType !== undefined ? { entityType: dto.entityType } : {}),
        ...(dto.currency !== undefined ? { currency: dto.currency } : {}),
        ...(dto.fiscalYear !== undefined ? { fiscalYear: dto.fiscalYear } : {}),
      },
    });
  }
}
