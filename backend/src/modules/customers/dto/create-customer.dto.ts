import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsEmail, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';
import { trimString } from '../../../common/utils/string-transform.util';

export class CreateCustomerDto {
  @ApiProperty({
    example: 'Atlas Cargo',
    description: 'Primary customer display name',
  })
  @Transform(({ value }) => trimString(value))
  @IsString()
  @IsNotEmpty()
  @MaxLength(160)
  displayName!: string;

  @ApiPropertyOptional({
    example: 'Atlas Cargo MMC',
    description: 'Registered company name if different from display name',
  })
  @IsOptional()
  @Transform(({ value }) => trimString(value))
  @IsString()
  @MaxLength(160)
  companyName?: string;

  @ApiPropertyOptional({
    example: 'ops@atlascargo.com',
    description: 'Customer contact email',
  })
  @IsOptional()
  @Transform(({ value }) => trimString(value))
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({
    example: '+994504445566',
    description: 'Customer contact phone',
  })
  @IsOptional()
  @Transform(({ value }) => trimString(value))
  @IsString()
  @MaxLength(50)
  phone?: string;

  @ApiPropertyOptional({
    example: '2002002001',
    description: 'Customer tax identifier if available',
  })
  @IsOptional()
  @Transform(({ value }) => trimString(value))
  @IsString()
  @MaxLength(50)
  taxId?: string;

  @ApiPropertyOptional({
    example: 'ACTIVE',
    description: 'Customer lifecycle status label',
  })
  @IsOptional()
  @Transform(({ value }) => trimString(value))
  @IsString()
  @MaxLength(30)
  status?: string;
}
