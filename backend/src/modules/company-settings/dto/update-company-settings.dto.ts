import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsOptional, IsString, Length, MaxLength } from 'class-validator';
import { trimAndUppercaseString, trimString } from '../../../common/utils/string-transform.util';

export class UpdateCompanySettingsDto {
  @ApiPropertyOptional({
    example: 'Tetavio MMC',
    description: 'Display company name for the authenticated account',
  })
  @IsOptional()
  @Transform(({ value }) => trimString(value))
  @IsString()
  @MaxLength(160)
  companyName?: string;

  @ApiPropertyOptional({
    example: '2009752131',
    description: 'Tax identification number if applicable',
  })
  @IsOptional()
  @Transform(({ value }) => trimString(value))
  @IsString()
  @MaxLength(50)
  taxId?: string;

  @ApiPropertyOptional({
    example: '+994103119187',
    description: 'Primary mobile contact number',
  })
  @IsOptional()
  @Transform(({ value }) => trimString(value))
  @IsString()
  @MaxLength(50)
  mobilePhone?: string;

  @ApiPropertyOptional({
    example: 'Huquqi sexs',
    description: 'Legal entity type label used in the company profile',
  })
  @IsOptional()
  @Transform(({ value }) => trimString(value))
  @IsString()
  @MaxLength(80)
  entityType?: string;

  @ApiPropertyOptional({
    example: 'AZN',
    description: 'Default accounting/reporting currency',
  })
  @IsOptional()
  @Transform(({ value }) => trimAndUppercaseString(value))
  @IsString()
  @Length(3, 3)
  currency?: string;

  @ApiPropertyOptional({
    example: '2026',
    description: 'Fiscal year label or identifier',
  })
  @IsOptional()
  @Transform(({ value }) => trimString(value))
  @IsString()
  @MaxLength(20)
  fiscalYear?: string;

  @ApiPropertyOptional({ example: 'INV-' })
  @IsOptional()
  @Transform(({ value }) => trimString(value))
  @IsString()
  @MaxLength(20)
  invoicePrefix?: string;

  @ApiPropertyOptional({ example: 'QUO-' })
  @IsOptional()
  @Transform(({ value }) => trimString(value))
  @IsString()
  @MaxLength(20)
  quotePrefix?: string;

  @ApiPropertyOptional({ example: '30' })
  @IsOptional()
  @Transform(({ value }) => trimString(value))
  @IsString()
  @MaxLength(20)
  defaultPaymentTerm?: string;

  @ApiPropertyOptional({ example: 'ƏDV 18%' })
  @IsOptional()
  @Transform(({ value }) => trimString(value))
  @IsString()
  @MaxLength(40)
  defaultTaxLabel?: string;

  @ApiPropertyOptional({ example: 'Avtomatik' })
  @IsOptional()
  @Transform(({ value }) => trimString(value))
  @IsString()
  @MaxLength(40)
  numberingMode?: string;

  @ApiPropertyOptional({ example: 'Bəli' })
  @IsOptional()
  @Transform(({ value }) => trimString(value))
  @IsString()
  @MaxLength(10)
  stockWarning?: string;

  @ApiPropertyOptional({ example: 'Xeyr' })
  @IsOptional()
  @Transform(({ value }) => trimString(value))
  @IsString()
  @MaxLength(10)
  negativeStock?: string;

  @ApiPropertyOptional({ example: 'Sənəd səviyyəsində' })
  @IsOptional()
  @Transform(({ value }) => trimString(value))
  @IsString()
  @MaxLength(40)
  discountMode?: string;

  @ApiPropertyOptional({ example: 'Vergidən əvvəl' })
  @IsOptional()
  @Transform(({ value }) => trimString(value))
  @IsString()
  @MaxLength(40)
  discountTiming?: string;

  @ApiPropertyOptional({ example: 'Bəli' })
  @IsOptional()
  @Transform(({ value }) => trimString(value))
  @IsString()
  @MaxLength(10)
  additionalAdjustment?: string;

  @ApiPropertyOptional({ example: 'Bəli' })
  @IsOptional()
  @Transform(({ value }) => trimString(value))
  @IsString()
  @MaxLength(10)
  shippingCharge?: string;

  @ApiPropertyOptional({ example: 'Vergi xaric' })
  @IsOptional()
  @Transform(({ value }) => trimString(value))
  @IsString()
  @MaxLength(40)
  taxMode?: string;

  @ApiPropertyOptional({ example: 'Yuvarlaqlaşdırma yoxdur' })
  @IsOptional()
  @Transform(({ value }) => trimString(value))
  @IsString()
  @MaxLength(40)
  salesRoundingMode?: string;

  @ApiPropertyOptional({ example: 'Xeyr' })
  @IsOptional()
  @Transform(({ value }) => trimString(value))
  @IsString()
  @MaxLength(10)
  salespersonField?: string;
}
