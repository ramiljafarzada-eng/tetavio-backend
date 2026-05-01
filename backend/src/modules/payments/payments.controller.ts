import {
  Body,
  Controller,
  Get,
  Headers,
  Post,
  Query,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiHeader,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import type { Response } from 'express';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { JwtPayload } from '../../common/interfaces/jwt-payload.interface';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CheckoutDto } from './dto/checkout.dto';
import { MockWebhookDto } from './dto/mock-webhook.dto';
import { PashaWebhookDto } from './dto/pasha-webhook.dto';
import { PaymentsService } from './payments.service';

@ApiTags('Payments')
@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post('checkout')
  @ApiOperation({ summary: 'Create checkout for pending paid order' })
  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard)
  @ApiBody({ type: CheckoutDto })
  checkout(
    @CurrentUser() user: JwtPayload,
    @Body() dto: CheckoutDto,
    @Req() req: any,
  ) {
    return this.paymentsService.checkout(user, dto, this.getClientIp(req));
  }

  @Post('webhooks/mock')
  @ApiOperation({ summary: 'Mock payment webhook callback (success/failed)' })
  @ApiBody({ type: MockWebhookDto })
  mockWebhook(@Body() dto: MockWebhookDto) {
    return this.paymentsService.handleMockWebhook(dto);
  }

  @Post('webhooks/pasha')
  @ApiOperation({ summary: 'PASHA payment webhook placeholder' })
  @ApiHeader({
    name: 'x-pasha-signature',
    required: false,
    description: 'HMAC-SHA256 signature of raw request body',
  })
  @ApiBody({ type: PashaWebhookDto })
  pashaWebhook(
    @Body() dto: PashaWebhookDto,
    @Headers('x-pasha-signature') signature: string | undefined,
    @Req() req: any,
  ) {
    return this.paymentsService.handlePashaWebhook(dto, signature, req.rawBody);
  }

  @Get('pasha/return')
  @ApiOperation({
    summary:
      'PASHA browser return endpoint that completes payment and redirects to frontend',
  })
  async pashaReturnGet(
    @Query('trans_id') transId: string | undefined,
    @Req() req: any,
    @Res() res: Response,
  ) {
    const redirectUrl = await this.paymentsService.completePashaReturn(
      transId,
      this.getClientIp(req),
    );
    return res.redirect(302, redirectUrl);
  }

  @Post('pasha/return')
  @ApiOperation({
    summary:
      'PASHA browser return endpoint that completes payment and redirects to frontend',
  })
  async pashaReturnPost(
    @Body('trans_id') transId: string | undefined,
    @Req() req: any,
    @Res() res: Response,
  ) {
    const redirectUrl = await this.paymentsService.completePashaReturn(
      transId,
      this.getClientIp(req),
    );
    return res.redirect(302, redirectUrl);
  }

  private getClientIp(req: any): string {
    const forwardedFor = req?.headers?.['x-forwarded-for'];
    if (typeof forwardedFor === 'string' && forwardedFor.trim()) {
      return forwardedFor.split(',')[0].trim();
    }

    if (typeof req?.ip === 'string' && req.ip.trim()) {
      return req.ip.trim();
    }

    if (
      typeof req?.socket?.remoteAddress === 'string' &&
      req.socket.remoteAddress.trim()
    ) {
      return req.socket.remoteAddress.trim();
    }

    return '127.0.0.1';
  }
}
