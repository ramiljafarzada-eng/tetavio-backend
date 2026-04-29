import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import { UserRole } from '@prisma/client';
import { trimString } from '../../../common/utils/string-transform.util';

const INVITABLE_ROLES = [UserRole.ADMIN, UserRole.ACCOUNTANT, UserRole.VIEWER, UserRole.OWNER] as const;

export class CreateTeamMemberDto {
  @ApiProperty({ example: 'ali@example.com' })
  @Transform(({ value }) => trimString(value))
  @IsEmail()
  email!: string;

  @ApiPropertyOptional({ example: 'Ali Həsənov' })
  @IsOptional()
  @Transform(({ value }) => trimString(value))
  @IsString()
  @MaxLength(120)
  fullName?: string;

  @ApiProperty({ enum: INVITABLE_ROLES, example: UserRole.ACCOUNTANT })
  @IsEnum(INVITABLE_ROLES, { message: 'role must be one of OWNER, ADMIN, ACCOUNTANT, VIEWER' })
  role!: UserRole;

  @ApiProperty({ example: 'SecurePass123', description: 'Initial password for the new member (min 8 chars)' })
  @IsString()
  @IsNotEmpty()
  @MinLength(8)
  @MaxLength(72)
  password!: string;
}
