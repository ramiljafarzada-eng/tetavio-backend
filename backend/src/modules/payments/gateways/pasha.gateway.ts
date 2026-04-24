import { Injectable } from '@nestjs/common';
import {
  CheckoutSessionInput,
  CheckoutSessionResult,
  PaymentGateway,
} from './payment-gateway.interface';

@Injectable()
export class PashaGateway implements PaymentGateway {
  async createCheckoutSession(
    _input: CheckoutSessionInput,
  ): Promise<CheckoutSessionResult> {
    throw new Error('Pasha gateway checkout is not implemented in v1 scope');
  }
}
