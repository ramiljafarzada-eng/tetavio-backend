import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsEmail, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';
import { trimString } from '../../../common/utils/string-transform.util';

export class CreateVendorDto {
  @ApiProperty({
    example: 'OfficeHub',
    description: 'Primary vendor display name',
  })
  @Transform(({ value }) => trimString(value))
  @IsString()
  @IsNotEmpty()
  @MaxLength(160)
  vendorName!: string;

  @ApiPropertyOptional({
    example: 'OfficeHub Supplies',
    description: 'Registered company name if different from vendor name',
  })
  @IsOptional()
  @Transform(({ value }) => trimString(value))
  @IsString()
  @MaxLength(160)
  companyName?: string;

  @ApiPropertyOptional({
    example: 'ar@officehub.com',
    description: 'Vendor contact email',
  })
  @IsOptional()
  @Transform(({ value }) => trimString(value))
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({
    example: '+994502223344',
    description: 'Vendor contact phone',
  })
  @IsOptional()
  @Transform(({ value }) => trimString(value))
  @IsString()
  @MaxLength(50)
  phone?: string;

  @ApiPropertyOptional({
    example: '1001001002',
    description: 'Vendor tax identifier if available',
  })
  @IsOptional()
  @Transform(({ value }) => trimString(value))
  @IsString()
  @MaxLength(50)
  taxId?: string;

  @ApiPropertyOptional({
    example: 'ACTIVE',
    description: 'Vendor lifecycle status label',
  })
  @IsOptional()
  @Transform(({ value }) => trimString(value))
  @IsString()
  @MaxLength(30)
  status?: string;
}
