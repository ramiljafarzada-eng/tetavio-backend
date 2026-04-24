import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  OrderStatus,
  PaymentGateway,
  PaymentStatus,
  Prisma,
  WebhookProcessingStatus,
} from '@prisma/client';
import { createHmac, timingSafeEqual } from 'node:crypto';
import type { JwtPayload } from '../../common/interfaces/jwt-payload.interface';
import { PrismaService } from '../prisma/prisma.service';
import { CheckoutDto } from './dto/checkout.dto';
import { MockWebhookDto } from './dto/mock-webhook.dto';
import { PashaWebhookDto } from './dto/pasha-webhook.dto';
import { MockGateway } from './gateways/mock.gateway';

@Injectable()
export class PaymentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
    private readonly mockGateway: MockGateway,
  ) {}

  async checkout(user: JwtPayload, dto: CheckoutDto) {
    const order = await this.prisma.order.findFirst({
      where: {
        id: dto.orderId,
        accountId: user.accountId,
      },
      include: {
        targetPlan: true,
      },
    });

    if (!order) {
      throw new NotFoundException('Order was not found for your account');
    }

    if (order.status !== OrderStatus.PENDING) {
      throw new BadRequestException('This order is not payable in its current state');
    }

    if (order.targetPlan.code === 'FREE' || order.amountMinor <= 0) {
      throw new BadRequestException('Free plan does not require a payment');
    }

    const existing = await this.prisma.paymentTransaction.findFirst({
      where: {
        orderId: order.id,
        gateway: PaymentGateway.MOCK,
        status: PaymentStatus.INITIATED,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    if (existing) {
      return {
        orderId: order.id,
        paymentTransactionId: existing.id,
        gateway: existing.gateway,
        gatewayPaymentId: existing.gatewayPaymentId,
        amountMinor: existing.amountMinor,
        currency: existing.currency,
        status: existing.status,
        nextAction: {
          type: 'OPEN_CHECKOUT',
        },
      };
    }

    const session = await this.mockGateway.createCheckoutSession({
      orderId: order.id,
      amountMinor: order.amountMinor,
      currency: order.currency,
    });

    const payment = await this.prisma.paymentTransaction.create({
      data: {
        orderId: order.id,
        gateway: PaymentGateway.MOCK,
        gatewayPaymentId: session.gatewayPaymentId,
        status: PaymentStatus.INITIATED,
        amountMinor: order.amountMinor,
        currency: order.currency,
        requestPayload: {
          orderId: order.id,
          amountMinor: order.amountMinor,
          currency: order.currency,
        },
        responsePayload: {
          checkoutUrl: session.checkoutUrl,
          expiresAt: session.expiresAt.toISOString(),
        },
      },
    });

    return {
      orderId: order.id,
      paymentTransactionId: payment.id,
      gateway: payment.gateway,
      gatewayPaymentId: payment.gatewayPaymentId,
      amountMinor: payment.amountMinor,
      currency: payment.currency,
      status: payment.status,
      checkoutUrl: session.checkoutUrl,
      expiresAt: session.expiresAt,
      nextAction: {
        type: 'OPEN_CHECKOUT',
      },
    };
  }

  async handleMockWebhook(dto: MockWebhookDto) {
    const eventLog = await this.createWebhookEvent({
      gateway: PaymentGateway.MOCK,
      eventId: dto.eventId,
      eventType: `mock.payment.${dto.status.toLowerCase()}`,
      signatureValid: true,
      payload: this.toInputJson({
        gatewayPaymentId: dto.gatewayPaymentId,
        status: dto.status,
        payload: dto.payload ?? null,
      }),
    });

    if (eventLog.isDuplicate) {
      return {
        message: 'Duplicate webhook ignored',
        eventId: dto.eventId,
      };
    }

    const payment = await this.prisma.paymentTransaction.findFirst({
      where: {
        gateway: PaymentGateway.MOCK,
        gatewayPaymentId: dto.gatewayPaymentId,
      },
      include: {
        order: {
          include: {
            subscription: true,
            targetPlan: true,
          },
        },
      },
    });

    if (!payment) {
      await this.markWebhookFailed(eventLog.id, 'Payment transaction not found');
      throw new NotFoundException('Payment transaction could not be matched');
    }

    if (dto.status === 'SUCCESS') {
      await this.applySuccessfulPayment(payment.id, dto.payload);
    } else {
      await this.applyFailedPayment(payment.id, dto.payload);
    }

    await this.prisma.paymentWebhookEvent.update({
      where: { id: eventLog.id },
      data: {
        processingStatus: WebhookProcessingStatus.PROCESSED,
        processedAt: new Date(),
      },
    });

    return {
      message: 'Mock webhook processed',
      eventId: dto.eventId,
      paymentId: payment.id,
      orderId: payment.orderId,
      appliedStatus: dto.status,
    };
  }

  async handlePashaWebhook(dto: PashaWebhookDto, signature?: string) {
    const signatureValid = this.verifyPashaSignature(signature, dto);

    const eventLog = await this.createWebhookEvent({
      gateway: PaymentGateway.PASHA,
      eventId: dto.eventId,
      eventType: dto.eventType,
      signatureValid,
      payload: this.toInputJson(dto),
    });

    if (eventLog.isDuplicate) {
      return {
        message: 'Duplicate webhook ignored',
        eventId: dto.eventId,
      };
    }

    if (!signatureValid) {
      await this.markWebhookFailed(eventLog.id, 'Invalid webhook signature');
      throw new BadRequestException('Webhook signature validation failed');
    }

    await this.prisma.paymentWebhookEvent.update({
      where: { id: eventLog.id },
      data: {
        processingStatus: WebhookProcessingStatus.PROCESSED,
        processedAt: new Date(),
      },
    });

    return {
      message: 'PASHA webhook accepted (stub)',
      eventId: dto.eventId,
      signatureValid: true,
      note: 'No business effect in v1 placeholder implementation',
    };
  }

  private async applySuccessfulPayment(
    paymentId: string,
    payload?: Record<string, unknown>,
  ) {
    await this.prisma.$transaction(async (tx) => {
      const payment = await tx.paymentTransaction.findUnique({
        where: { id: paymentId },
        include: {
          order: {
            include: {
              subscription: true,
              targetPlan: true,
            },
          },
        },
      });

      if (!payment) {
        throw new NotFoundException('Payment transaction not found');
      }

      if (payment.status === PaymentStatus.SUCCESS) {
        return;
      }

      await tx.paymentTransaction.update({
        where: { id: payment.id },
        data: {
          status: PaymentStatus.SUCCESS,
          responsePayload: this.toInputJson(
            this.buildWebhookResponsePayload(
              payment.responsePayload,
              payload,
              'SUCCESS',
            ),
          ),
        },
      });

      await tx.order.update({
        where: { id: payment.order.id },
        data: {
          status: OrderStatus.PAID,
          paidAt: new Date(),
        },
      });

      const subscriptionId = payment.order.subscriptionId;
      if (!subscriptionId) {
        throw new BadRequestException('Order has no linked subscription');
      }

      const now = new Date();
      const periodEnd = new Date(now);
      periodEnd.setUTCMonth(periodEnd.getUTCMonth() + 1);

      await tx.subscription.update({
        where: { id: subscriptionId },
        data: {
          planId: payment.order.targetPlanId,
          status: 'ACTIVE',
          currentPeriodStart: now,
          currentPeriodEnd: periodEnd,
          cancelAtPeriodEnd: false,
          scheduledPlanId: null,
          scheduledChangeAt: null,
        },
      });
    });
  }

  private async applyFailedPayment(
    paymentId: string,
    payload?: Record<string, unknown>,
  ) {
    await this.prisma.$transaction(async (tx) => {
      const payment = await tx.paymentTransaction.findUnique({
        where: { id: paymentId },
        include: { order: true },
      });

      if (!payment) {
        throw new NotFoundException('Payment transaction not found');
      }

      if (payment.status === PaymentStatus.FAILED) {
        return;
      }

      await tx.paymentTransaction.update({
        where: { id: payment.id },
        data: {
          status: PaymentStatus.FAILED,
          responsePayload: this.toInputJson(
            this.buildWebhookResponsePayload(
              payment.responsePayload,
              payload,
              'FAILED',
            ),
          ),
        },
      });

      await tx.order.update({
        where: { id: payment.order.id },
        data: {
          status: OrderStatus.FAILED,
        },
      });
    });
  }

  private verifyPashaSignature(
    signature: string | undefined,
    payload: PashaWebhookDto,
  ): boolean {
    if (!signature) {
      return false;
    }

    const secret = this.configService.get<string>(
      'PASHA_WEBHOOK_SECRET',
      'dev-pasha-secret',
    );
    const rawBody = JSON.stringify(payload);
    const expected = createHmac('sha256', secret).update(rawBody).digest('hex');

    const left = Buffer.from(signature);
    const right = Buffer.from(expected);

    if (left.length !== right.length) {
      return false;
    }

    return timingSafeEqual(left, right);
  }

  private async createWebhookEvent(input: {
    gateway: PaymentGateway;
    eventId: string;
    eventType: string;
    signatureValid: boolean;
    payload: Prisma.InputJsonValue;
  }) {
    try {
      const created = await this.prisma.paymentWebhookEvent.create({
        data: {
          gateway: input.gateway,
          eventId: input.eventId,
          eventType: input.eventType,
          signatureValid: input.signatureValid,
          payload: input.payload,
          processingStatus: WebhookProcessingStatus.PENDING,
        },
      });

      return { ...created, isDuplicate: false };
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        const existing = await this.prisma.paymentWebhookEvent.findFirst({
          where: {
            gateway: input.gateway,
            eventId: input.eventId,
          },
        });

        if (!existing) {
          throw error;
        }

        return { ...existing, isDuplicate: true };
      }

      throw error;
    }
  }

  private async markWebhookFailed(eventId: string, errorMessage: string) {
    await this.prisma.paymentWebhookEvent.update({
      where: { id: eventId },
      data: {
        processingStatus: WebhookProcessingStatus.FAILED,
        errorMessage,
        processedAt: new Date(),
      },
    });
  }

  private buildWebhookResponsePayload(
    existing: Prisma.JsonValue | null,
    payload: Record<string, unknown> | undefined,
    webhookStatus: 'SUCCESS' | 'FAILED',
  ): Record<string, unknown> {
    const base =
      existing && typeof existing === 'object' && !Array.isArray(existing)
        ? (existing as Record<string, unknown>)
        : {};

    return {
      ...base,
      webhook: payload ?? null,
      webhookStatus,
    };
  }

  private toInputJson(value: unknown): Prisma.InputJsonValue {
    return value as Prisma.InputJsonValue;
  }
}
