import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { UserRole, UserStatus } from '@prisma/client';
import { hash } from 'bcryptjs';
import type { JwtPayload } from '../../common/interfaces/jwt-payload.interface';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTeamMemberDto } from './dto/create-team-member.dto';
import { UpdateTeamMemberDto } from './dto/update-team-member.dto';

const SAFE_SELECT = {
  id: true,
  email: true,
  fullName: true,
  role: true,
  status: true,
  createdAt: true,
} as const;

type SafeRow = {
  id: string;
  email: string;
  fullName: string | null;
  role: UserRole;
  status: UserStatus;
  createdAt: Date;
};

function toResponse(row: SafeRow) {
  return {
    id: row.id,
    email: row.email,
    fullName: row.fullName ?? null,
    role: row.role,
    isActive: row.status === UserStatus.ACTIVE,
    createdAt: row.createdAt,
  };
}

@Injectable()
export class TeamService {
  constructor(private readonly prisma: PrismaService) {}

  private requireManagerRole(user: JwtPayload): void {
    if (user.role !== 'OWNER' && user.role !== 'ADMIN') {
      throw new ForbiddenException('Only OWNER or ADMIN can manage team members');
    }
  }

  async list(user: JwtPayload) {
    const rows = await this.prisma.user.findMany({
      where: {
        accountId: user.accountId,
        role: { not: UserRole.SUPER_ADMIN },
      },
      select: SAFE_SELECT,
      orderBy: { createdAt: 'asc' },
    });
    return rows.map(toResponse);
  }

  async create(user: JwtPayload, dto: CreateTeamMemberDto) {
    this.requireManagerRole(user);

    const email = dto.email.trim().toLowerCase();
    const existing = await this.prisma.user.findUnique({ where: { email } });
    if (existing) {
      throw new ConflictException('Email is already in use');
    }

    const passwordHash = await hash(dto.password, 12);
    const created = await this.prisma.user.create({
      data: {
        accountId: user.accountId,
        email,
        fullName: dto.fullName?.trim() ?? null,
        passwordHash,
        role: dto.role,
        status: UserStatus.ACTIVE,
        isEmailVerified: false,
      },
      select: SAFE_SELECT,
    });

    return toResponse(created);
  }

  async update(user: JwtPayload, memberId: string, dto: UpdateTeamMemberDto) {
    this.requireManagerRole(user);

    const member = await this.prisma.user.findFirst({
      where: { id: memberId, accountId: user.accountId, role: { not: UserRole.SUPER_ADMIN } },
      select: SAFE_SELECT,
    });
    if (!member) throw new NotFoundException('Team member not found');

    if (dto.role !== undefined && member.role === UserRole.OWNER && dto.role !== UserRole.OWNER) {
      await this.assertNotLastActiveOwner(user.accountId, memberId);
    }

    const data: { role?: UserRole; status?: UserStatus } = {};
    if (dto.role !== undefined) data.role = dto.role;
    if (dto.isActive !== undefined) {
      if (!dto.isActive && member.role === UserRole.OWNER) {
        await this.assertNotLastActiveOwner(user.accountId, memberId);
      }
      data.status = dto.isActive ? UserStatus.ACTIVE : UserStatus.SUSPENDED;
    }

    const updated = await this.prisma.user.update({
      where: { id: memberId },
      data,
      select: SAFE_SELECT,
    });

    return toResponse(updated);
  }

  async deactivate(user: JwtPayload, memberId: string) {
    this.requireManagerRole(user);

    if (memberId === user.sub) {
      throw new BadRequestException('You cannot deactivate yourself');
    }

    const member = await this.prisma.user.findFirst({
      where: { id: memberId, accountId: user.accountId, role: { not: UserRole.SUPER_ADMIN } },
      select: SAFE_SELECT,
    });
    if (!member) throw new NotFoundException('Team member not found');

    if (member.role === UserRole.OWNER) {
      await this.assertNotLastActiveOwner(user.accountId, memberId);
    }

    const updated = await this.prisma.user.update({
      where: { id: memberId },
      data: { status: UserStatus.SUSPENDED },
      select: SAFE_SELECT,
    });

    return toResponse(updated);
  }

  private async assertNotLastActiveOwner(accountId: string, excludeId: string): Promise<void> {
    const activeOwners = await this.prisma.user.count({
      where: {
        accountId,
        role: UserRole.OWNER,
        status: UserStatus.ACTIVE,
        id: { not: excludeId },
      },
    });
    if (activeOwners === 0) {
      throw new BadRequestException('Cannot remove or demote the last active OWNER of an account');
    }
  }
}
