import {
  BadRequestException,
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  Prisma,
  RefreshToken,
  SubscriptionStatus,
} from '@prisma/client';
import { JwtService } from '@nestjs/jwt';
import { compare, hash } from 'bcryptjs';
import { createHash, randomBytes, randomUUID } from 'node:crypto';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { LogoutDto } from './dto/logout.dto';
import type { JwtPayload } from '../../common/interfaces/jwt-payload.interface';
import { EmailVerificationRequestDto } from './dto/email-verification-request.dto';
import { EmailVerificationConfirmDto } from './dto/email-verification-confirm.dto';
import { PasswordResetRequestDto } from './dto/password-reset-request.dto';
import { PasswordResetConfirmDto } from './dto/password-reset-confirm.dto';

type UserIdentity = {
  id: string;
  accountId: string;
  email: string;
};

type RequestMeta = {
  ip?: string;
  userAgent?: string;
};

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async register(dto: RegisterDto, meta: RequestMeta) {
    const email = this.normalizeEmail(dto.email);
    const existingUser = await this.prisma.user.findUnique({ where: { email } });

    if (existingUser) {
      throw new ConflictException('This email is already in use');
    }

    const freePlan = await this.prisma.plan.findUnique({ where: { code: 'FREE' } });
    if (!freePlan || !freePlan.isActive) {
      throw new BadRequestException('Free plan is not configured');
    }

    const passwordHash = await hash(dto.password, 12);
    const now = new Date();

    const user = await this.prisma.$transaction(async (tx) => {
      const account = await tx.account.create({
        data: {
          name: dto.fullName?.trim() || email,
          type: 'INDIVIDUAL',
        },
      });

      const createdUser = await tx.user.create({
        data: {
          accountId: account.id,
          email,
          passwordHash,
          fullName: dto.fullName?.trim(),
          isEmailVerified: false,
          status: 'ACTIVE',
        },
      });

      await tx.subscription.create({
        data: {
          accountId: account.id,
          planId: freePlan.id,
          status: SubscriptionStatus.ACTIVE,
          currentPeriodStart: now,
          currentPeriodEnd: null,
          cancelAtPeriodEnd: false,
        },
      });

      return createdUser;
    });

    const tokens = await this.issueTokenPair(
      {
        id: user.id,
        accountId: user.accountId,
        email: user.email,
      },
      meta,
    );

    return {
      user: {
        id: user.id,
        accountId: user.accountId,
        email: user.email,
        fullName: user.fullName,
        isEmailVerified: user.isEmailVerified,
      },
      tokens,
    };
  }

  async login(dto: LoginDto, meta: RequestMeta) {
    const email = this.normalizeEmail(dto.email);
    const user = await this.prisma.user.findUnique({ where: { email } });

    if (!user) {
      throw new UnauthorizedException('Email or password is incorrect');
    }

    const validPassword = await compare(dto.password, user.passwordHash);
    if (!validPassword) {
      throw new UnauthorizedException('Email or password is incorrect');
    }

    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    const tokens = await this.issueTokenPair(
      {
        id: user.id,
        accountId: user.accountId,
        email: user.email,
      },
      meta,
    );

    return {
      user: {
        id: user.id,
        accountId: user.accountId,
        email: user.email,
        fullName: user.fullName,
        isEmailVerified: user.isEmailVerified,
      },
      tokens,
    };
  }

  async refresh(dto: RefreshTokenDto, meta: RequestMeta) {
    const incomingTokenHash = this.hashToken(dto.refreshToken);
    const existing = await this.prisma.refreshToken.findUnique({
      where: { tokenHash: incomingTokenHash },
      include: { user: true },
    });

    if (!existing) {
      throw new UnauthorizedException('Session is invalid. Please log in again');
    }

    if (existing.revokedAt) {
      await this.revokeTokenFamily(existing.familyId);
      throw new UnauthorizedException('Session has been revoked. Please log in again');
    }

    if (existing.expiresAt.getTime() <= Date.now()) {
      throw new UnauthorizedException('Session expired. Please log in again');
    }

    const rotated = await this.rotateRefreshToken(existing, meta);
    const accessToken = await this.signAccessToken({
      sub: existing.user.id,
      accountId: existing.user.accountId,
      email: existing.user.email,
    });

    return {
      accessToken,
      refreshToken: rotated.rawToken,
      tokenType: 'Bearer',
    };
  }

  async logout(dto: LogoutDto) {
    const tokenHash = this.hashToken(dto.refreshToken);
    const existing = await this.prisma.refreshToken.findUnique({
      where: { tokenHash },
    });

    if (existing && !existing.revokedAt) {
      await this.prisma.refreshToken.update({
        where: { id: existing.id },
        data: { revokedAt: new Date() },
      });
    }

    return { message: 'Logged out successfully' };
  }

  async logoutAll(userId: string) {
    await this.prisma.refreshToken.updateMany({
      where: {
        userId,
        revokedAt: null,
      },
      data: {
        revokedAt: new Date(),
      },
    });

    return { message: 'Logged out from all devices' };
  }

  async me(payload: JwtPayload) {
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      select: {
        id: true,
        accountId: true,
        email: true,
        fullName: true,
        isEmailVerified: true,
        status: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    return user;
  }

  async requestEmailVerification(dto: EmailVerificationRequestDto) {
    const email = this.normalizeEmail(dto.email);
    const user = await this.prisma.user.findUnique({ where: { email } });

    if (!user || user.isEmailVerified) {
      return { message: 'If the email exists, verification instructions were sent' };
    }

    const rawToken = this.generateOpaqueToken();
    const tokenHash = this.hashToken(rawToken);
    const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24);

    await this.prisma.emailVerificationToken.create({
      data: {
        userId: user.id,
        tokenHash,
        expiresAt,
      },
    });

    return {
      message: 'Verification token created',
      verificationToken: this.shouldExposeDevTokens() ? rawToken : undefined,
    };
  }

  async confirmEmailVerification(dto: EmailVerificationConfirmDto) {
    const tokenHash = this.hashToken(dto.token);

    const token = await this.prisma.emailVerificationToken.findUnique({
      where: { tokenHash },
    });

    if (!token || token.usedAt || token.expiresAt.getTime() <= Date.now()) {
      throw new BadRequestException('Verification link is invalid or expired');
    }

    await this.prisma.$transaction([
      this.prisma.emailVerificationToken.update({
        where: { id: token.id },
        data: { usedAt: new Date() },
      }),
      this.prisma.user.update({
        where: { id: token.userId },
        data: { isEmailVerified: true },
      }),
    ]);

    return { message: 'Email verified successfully' };
  }

  async requestPasswordReset(dto: PasswordResetRequestDto) {
    const email = this.normalizeEmail(dto.email);
    const user = await this.prisma.user.findUnique({ where: { email } });

    if (!user) {
      return { message: 'If the email exists, password reset instructions were sent' };
    }

    const rawToken = this.generateOpaqueToken();
    const tokenHash = this.hashToken(rawToken);
    const expiresAt = new Date(Date.now() + 1000 * 60 * 60);

    await this.prisma.passwordResetToken.create({
      data: {
        userId: user.id,
        tokenHash,
        expiresAt,
      },
    });

    return {
      message: 'Password reset token created',
      resetToken: this.shouldExposeDevTokens() ? rawToken : undefined,
    };
  }

  async confirmPasswordReset(dto: PasswordResetConfirmDto) {
    const tokenHash = this.hashToken(dto.token);
    const token = await this.prisma.passwordResetToken.findUnique({
      where: { tokenHash },
    });

    if (!token || token.usedAt || token.expiresAt.getTime() <= Date.now()) {
      throw new BadRequestException('Password reset link is invalid or expired');
    }

    const passwordHash = await hash(dto.newPassword, 12);

    await this.prisma.$transaction([
      this.prisma.passwordResetToken.update({
        where: { id: token.id },
        data: { usedAt: new Date() },
      }),
      this.prisma.user.update({
        where: { id: token.userId },
        data: { passwordHash },
      }),
      this.prisma.refreshToken.updateMany({
        where: { userId: token.userId, revokedAt: null },
        data: { revokedAt: new Date() },
      }),
    ]);

    return { message: 'Password reset completed' };
  }

  private normalizeEmail(email: string): string {
    return email.trim().toLowerCase();
  }

  private hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }

  private generateOpaqueToken(): string {
    return randomBytes(64).toString('hex');
  }

  private getRefreshTokenExpiry(): Date {
    const raw = this.configService.get<string>('JWT_REFRESH_EXPIRES_IN', '30d');
    const durationMs = this.parseDuration(raw);
    return new Date(Date.now() + durationMs);
  }

  private parseDuration(value: string): number {
    const match = /^(\d+)([smhd])$/.exec(value.trim());
    if (!match) {
      return 1000 * 60 * 60 * 24 * 30;
    }

    const amount = Number(match[1]);
    const unit = match[2];
    const unitMap: Record<string, number> = {
      s: 1000,
      m: 1000 * 60,
      h: 1000 * 60 * 60,
      d: 1000 * 60 * 60 * 24,
    };

    return amount * unitMap[unit];
  }

  private async signAccessToken(payload: JwtPayload): Promise<string> {
    const accessExpiryRaw = this.configService.get<string>(
      'JWT_ACCESS_EXPIRES_IN',
      '15m',
    );

    return this.jwtService.signAsync(payload, {
      secret: this.configService.get<string>('JWT_ACCESS_SECRET', 'dev-access-secret'),
      expiresIn: Math.floor(this.parseDuration(accessExpiryRaw) / 1000),
    });
  }

  private async issueTokenPair(user: UserIdentity, meta: RequestMeta) {
    const familyId = randomUUID();
    const refresh = await this.createRefreshToken(user.id, familyId, meta);
    const accessToken = await this.signAccessToken({
      sub: user.id,
      accountId: user.accountId,
      email: user.email,
    });

    return {
      accessToken,
      refreshToken: refresh.rawToken,
      tokenType: 'Bearer',
    };
  }

  private async createRefreshToken(
    userId: string,
    familyId: string,
    meta: RequestMeta,
    tx?: Prisma.TransactionClient,
  ) {
    const rawToken = this.generateOpaqueToken();
    const tokenHash = this.hashToken(rawToken);
    const expiresAt = this.getRefreshTokenExpiry();
    const prisma = tx ?? this.prisma;

    const token = await prisma.refreshToken.create({
      data: {
        userId,
        tokenHash,
        familyId,
        expiresAt,
        ip: meta.ip,
        userAgent: meta.userAgent,
      },
    });

    return {
      token,
      rawToken,
    };
  }

  private async rotateRefreshToken(existing: RefreshToken, meta: RequestMeta) {
    const rotated = await this.prisma.$transaction(async (tx) => {
      const created = await this.createRefreshToken(
        existing.userId,
        existing.familyId,
        meta,
        tx,
      );

      await tx.refreshToken.update({
        where: { id: existing.id },
        data: {
          revokedAt: new Date(),
          replacedByTokenId: created.token.id,
        },
      });

      return created;
    });

    return rotated;
  }

  private async revokeTokenFamily(familyId: string) {
    await this.prisma.refreshToken.updateMany({
      where: {
        familyId,
        revokedAt: null,
      },
      data: {
        revokedAt: new Date(),
      },
    });
  }

  private shouldExposeDevTokens(): boolean {
    return this.configService.get<string>('NODE_ENV', 'development') !== 'production';
  }
}
