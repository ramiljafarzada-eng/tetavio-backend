import { Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import {
  CheckoutSessionInput,
  CheckoutSessionResult,
  PaymentGateway,
} from './payment-gateway.interface';

@Injectable()
export class MockGateway implements PaymentGateway {
  async createCheckoutSession(
    input: CheckoutSessionInput,
  ): Promise<CheckoutSessionResult> {
    const gatewayPaymentId = `mock_${randomUUID()}`;
    const expiresAt = new Date(Date.now() + 1000 * 60 * 15);

    return {
      gatewayPaymentId,
      checkoutUrl: `https://mock-gateway.local/checkout/${input.orderId}?paymentId=${gatewayPaymentId}`,
      expiresAt,
    };
  }
}
