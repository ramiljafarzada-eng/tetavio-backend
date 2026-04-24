import {
  Body,
  Controller,
  Headers,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiHeader,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
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
  @ApiOperation({ summary: 'Create mock checkout for pending paid order' })
  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard)
  @ApiBody({ type: CheckoutDto })
  checkout(@CurrentUser() user: JwtPayload, @Body() dto: CheckoutDto) {
    return this.paymentsService.checkout(user, dto);
  }

  @Post('webhooks/mock')
  @ApiOperation({ summary: 'Mock payment webhook callback (success/failed)' })
  @ApiBody({ type: MockWebhookDto })
  mockWebhook(@Body() dto: MockWebhookDto) {
    return this.paymentsService.handleMockWebhook(dto);
  }

  @Post('webhooks/pasha')
  @ApiOperation({ summary: 'PASHA webhook placeholder with signature check skeleton' })
  @ApiHeader({
    name: 'x-pasha-signature',
    required: false,
    description: 'HMAC-SHA256 signature of request payload',
  })
  @ApiBody({ type: PashaWebhookDto })
  pashaWebhook(
    @Body() dto: PashaWebhookDto,
    @Headers('x-pasha-signature') signature?: string,
  ) {
    return this.paymentsService.handlePashaWebhook(dto, signature);
  }
}
