export interface CheckoutSessionInput {
  orderId: string;
  amountMinor: number;
  currency: string;
  clientIpAddress?: string;
  description?: string;
  language?: string;
}

export interface CheckoutSessionResult {
  gatewayPaymentId: string;
  checkoutUrl: string;
  expiresAt: Date;
}

export interface PaymentGateway {
  createCheckoutSession(input: CheckoutSessionInput): Promise<CheckoutSessionResult>;
}
