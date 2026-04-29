import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsEnum, IsOptional } from 'class-validator';
import { UserRole } from '@prisma/client';

const UPDATABLE_ROLES = [UserRole.OWNER, UserRole.ADMIN, UserRole.ACCOUNTANT, UserRole.VIEWER] as const;

export class UpdateTeamMemberDto {
  @ApiPropertyOptional({ enum: UPDATABLE_ROLES })
  @IsOptional()
  @IsEnum(UPDATABLE_ROLES, { message: 'role must be one of OWNER, ADMIN, ACCOUNTANT, VIEWER' })
  role?: UserRole;

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
