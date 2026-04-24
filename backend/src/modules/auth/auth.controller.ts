import {
  Body,
  Controller,
  Get,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import type { Request } from 'express';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { JwtPayload } from '../../common/interfaces/jwt-payload.interface';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { LogoutDto } from './dto/logout.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { RegisterDto } from './dto/register.dto';
import { EmailVerificationRequestDto } from './dto/email-verification-request.dto';
import { EmailVerificationConfirmDto } from './dto/email-verification-confirm.dto';
import { PasswordResetRequestDto } from './dto/password-reset-request.dto';
import { PasswordResetConfirmDto } from './dto/password-reset-confirm.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  private buildRequestMeta(req: Request): { ip?: string; userAgent?: string } {
    const header = req.headers['user-agent'];
    const userAgent = Array.isArray(header) ? header[0] : header;

    return {
      ip: req.ip,
      userAgent,
    };
  }

  @Post('register')
  @ApiOperation({ summary: 'Register a user and create FREE subscription' })
  @ApiBody({ type: RegisterDto })
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  register(@Body() dto: RegisterDto, @Req() req: Request) {
    return this.authService.register(dto, this.buildRequestMeta(req));
  }

  @Post('login')
  @ApiOperation({ summary: 'Login user and issue token pair' })
  @ApiBody({ type: LoginDto })
  @Throttle({ default: { limit: 8, ttl: 60_000 } })
  login(@Body() dto: LoginDto, @Req() req: Request) {
    return this.authService.login(dto, this.buildRequestMeta(req));
  }

  @Post('refresh')
  @ApiOperation({ summary: 'Rotate refresh token and issue new token pair' })
  @ApiBody({ type: RefreshTokenDto })
  @Throttle({ default: { limit: 20, ttl: 60_000 } })
  refresh(@Body() dto: RefreshTokenDto, @Req() req: Request) {
    return this.authService.refresh(dto, this.buildRequestMeta(req));
  }

  @Post('logout')
  @ApiOperation({ summary: 'Revoke current refresh token' })
  @ApiBody({ type: LogoutDto })
  logout(@Body() dto: LogoutDto) {
    return this.authService.logout(dto);
  }

  @Post('logout-all')
  @ApiOperation({ summary: 'Revoke all refresh tokens for authenticated user' })
  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard)
  logoutAll(@CurrentUser() user: JwtPayload) {
    return this.authService.logoutAll(user.sub);
  }

  @Get('me')
  @ApiOperation({ summary: 'Get current user profile' })
  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard)
  me(@CurrentUser() user: JwtPayload) {
    return this.authService.me(user);
  }

  @Post('verify-email/request')
  @ApiOperation({ summary: 'Create email verification token' })
  @ApiBody({ type: EmailVerificationRequestDto })
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  requestEmailVerification(@Body() dto: EmailVerificationRequestDto) {
    return this.authService.requestEmailVerification(dto);
  }

  @Post('verify-email/confirm')
  @ApiOperation({ summary: 'Confirm email verification token' })
  @ApiBody({ type: EmailVerificationConfirmDto })
  confirmEmailVerification(@Body() dto: EmailVerificationConfirmDto) {
    return this.authService.confirmEmailVerification(dto);
  }

  @Post('password-reset/request')
  @ApiOperation({ summary: 'Create password reset token' })
  @ApiBody({ type: PasswordResetRequestDto })
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  requestPasswordReset(@Body() dto: PasswordResetRequestDto) {
    return this.authService.requestPasswordReset(dto);
  }

  @Post('password-reset/confirm')
  @ApiOperation({ summary: 'Confirm password reset token' })
  @ApiBody({ type: PasswordResetConfirmDto })
  confirmPasswordReset(@Body() dto: PasswordResetConfirmDto) {
    return this.authService.confirmPasswordReset(dto);
  }
}
