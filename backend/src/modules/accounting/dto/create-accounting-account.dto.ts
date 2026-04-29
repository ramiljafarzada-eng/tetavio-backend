import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsBoolean, IsNotEmpty, IsNumber, IsOptional, IsString, MaxLength, Min } from 'class-validator';
import { trimString } from '../../../common/utils/string-transform.util';

export class CreateAccountingAccountDto {
  @ApiProperty({ example: '201', description: 'Account code (unique per tenant)' })
  @Transform(({ value }) => trimString(value))
  @IsString()
  @IsNotEmpty()
  @MaxLength(20)
  accountCode!: string;

  @ApiProperty({ example: 'Mallar', description: 'Account name' })
  @Transform(({ value }) => trimString(value))
  @IsString()
  @IsNotEmpty()
  @MaxLength(160)
  accountName!: string;

  @ApiProperty({ example: 'Aktiv', description: 'Account type (Aktiv/Öhdəlik/Gəlir/Xərc/Kapital)' })
  @Transform(({ value }) => trimString(value))
  @IsString()
  @IsNotEmpty()
  @MaxLength(30)
  accountType!: string;

  @ApiPropertyOptional({ example: 'Aktiv', description: 'Aktiv = active, Passiv = inactive' })
  @IsOptional()
  @Transform(({ value }) => trimString(value))
  @IsString()
  @MaxLength(10)
  status?: string;

  @ApiPropertyOptional({ example: 0, description: 'Opening balance in account currency units' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  balance?: number;
}
