export interface CheckoutSessionInput {
  orderId: string;
  amountMinor: number;
  currency: string;
}

export interface CheckoutSessionResult {
  gatewayPaymentId: string;
  checkoutUrl: string;
  expiresAt: Date;
}

export interface PaymentGateway {
  createCheckoutSession(input: CheckoutSessionInput): Promise<CheckoutSessionResult>;
}
