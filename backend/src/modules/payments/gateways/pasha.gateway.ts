import {
  Injectable,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { readFileSync } from 'node:fs';
import * as https from 'node:https';
import {
  CheckoutSessionInput,
  CheckoutSessionResult,
  PaymentGateway,
} from './payment-gateway.interface';

@Injectable()
export class PashaGateway implements PaymentGateway {
  constructor(private readonly configService: ConfigService) {}

  async createCheckoutSession(
    input: CheckoutSessionInput,
  ): Promise<CheckoutSessionResult> {
    const terminalId = this.configService.get<string>('PASHA_TERMINAL_ID');
    const clientHandlerUrl = this.configService.get<string>(
      'PASHA_CLIENT_HANDLER_URL',
      'https://ecomm.pashabank.az:8463/ecomm2/ClientHandler',
    );
    const language = this.normalizeLanguage(input.language);
    const currency = this.normalizeCurrency(input.currency);
    const amountMajor = this.minorToMajor(input.amountMinor);
    const responseText = await this.sendMerchantRequest({
      command: 'V',
      amount: amountMajor,
      currency,
      client_ip_addr: input.clientIpAddress ?? '127.0.0.1',
      description: input.description ?? 'Tetavio subscription payment',
      language,
      msg_type: 'SMS',
      ...(terminalId ? { terminal_id: terminalId } : {}),
    });

    const transactionId = this.extractSingleLineValue(
      responseText,
      'TRANSACTION_ID',
    );

    if (!transactionId) {
      throw new ServiceUnavailableException(
        'Payment gateway returned an invalid response.',
      );
    }

    const checkoutUrl = `${clientHandlerUrl}?trans_id=${encodeURIComponent(transactionId)}`;

    return {
      gatewayPaymentId: transactionId,
      checkoutUrl,
      expiresAt: new Date(Date.now() + 30 * 60 * 1000),
    };
  }

  async getTransactionResult(
    transactionId: string,
    clientIpAddress: string,
  ): Promise<Record<string, string>> {
    const responseText = await this.sendMerchantRequest({
      command: 'C',
      trans_id: transactionId,
      client_ip_addr: clientIpAddress || '127.0.0.1',
    });

    return this.parseKeyValueResponse(responseText);
  }

  private normalizeLanguage(language: string | undefined): string {
    const normalized = String(language ?? 'az')
      .trim()
      .toLowerCase();

    if (normalized === 'az' || normalized === 'en' || normalized === 'ru') {
      return normalized;
    }

    return 'az';
  }

  private normalizeCurrency(currency: string | undefined): string {
    const normalized = String(currency ?? 'AZN')
      .trim()
      .toUpperCase();

    const mapped = {
      AZN: '944',
      USD: '840',
      EUR: '978',
      GBP: '826',
    }[normalized];

    return mapped ?? normalized;
  }

  private minorToMajor(amountMinor: number): string {
    return String(Math.round(amountMinor) / 100);
  }

  private async sendMerchantRequest(
    params: Record<string, string>,
  ): Promise<string> {
    const merchantHandlerUrl = this.configService.get<string>(
      'PASHA_MERCHANT_HANDLER_URL',
      'https://ecomm.pashabank.az:18443/ecomm2/MerchantHandler',
    );

    if (!merchantHandlerUrl) {
      throw new ServiceUnavailableException(
        'Payment gateway is not configured. Please contact support.',
      );
    }

    const url = new URL(merchantHandlerUrl);
    const body = new URLSearchParams(params).toString();
    const tlsOptions = this.buildTlsOptions();

    return new Promise<string>((resolve, reject) => {
      const request = https.request(
        {
          protocol: url.protocol,
          hostname: url.hostname,
          port: url.port,
          path: `${url.pathname}${url.search}`,
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Content-Length': Buffer.byteLength(body),
          },
          ...tlsOptions,
        },
        (response) => {
          const chunks: Buffer[] = [];

          response.on('data', (chunk) => {
            chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
          });

          response.on('end', () => {
            const payload = Buffer.concat(chunks).toString('utf8');

            if (
              response.statusCode &&
              (response.statusCode < 200 || response.statusCode >= 300)
            ) {
              reject(
                new ServiceUnavailableException(
                  `Payment gateway error (${response.statusCode}). Please try again.`,
                ),
              );
              return;
            }

            resolve(payload);
          });
        },
      );

      request.on('error', () => {
        reject(
          new ServiceUnavailableException(
            'Payment gateway is unreachable. Please try again.',
          ),
        );
      });

      request.write(body);
      request.end();
    });
  }

  private readCertMaterial(pathKey: string, b64Key: string): Buffer | undefined {
    const path = this.configService.get<string>(pathKey);
    if (path) return readFileSync(path);
    const b64 = this.configService.get<string>(b64Key);
    if (b64) return Buffer.from(b64, 'base64');
    return undefined;
  }

  private buildTlsOptions(): https.RequestOptions {
    const pfxPath = this.configService.get<string>('PASHA_PFX_PATH');
    const pfxB64 = this.configService.get<string>('PASHA_PFX_B64');
    const passphrase = this.configService.get<string>('PASHA_KEY_PASSPHRASE');
    const rejectUnauthorized =
      this.configService.get<string>('PASHA_REJECT_UNAUTHORIZED', 'true') !==
      'false';

    const pfx = pfxPath ? readFileSync(pfxPath) : pfxB64 ? Buffer.from(pfxB64, 'base64') : undefined;
    const cert = this.readCertMaterial('PASHA_CERT_PATH', 'PASHA_CERT_B64');
    const key = this.readCertMaterial('PASHA_KEY_PATH', 'PASHA_KEY_B64');
    const ca = this.readCertMaterial('PASHA_CA_PATH', 'PASHA_CA_B64');

    if (!pfx && (!cert || !key)) {
      throw new ServiceUnavailableException(
        'PASHA certificate configuration is missing. Please contact support.',
      );
    }

    return {
      ...(pfx ? { pfx } : {}),
      ...(cert ? { cert } : {}),
      ...(key ? { key } : {}),
      ...(ca ? { ca } : {}),
      ...(passphrase ? { passphrase } : {}),
      rejectUnauthorized,
      minVersion: 'TLSv1.2',
      checkServerIdentity: () => undefined,
    };
  }

  private extractSingleLineValue(
    responseText: string,
    key: string,
  ): string | null {
    const parsed = this.parseKeyValueResponse(responseText);
    const value = parsed[key];
    return value ? value.trim() : null;
  }

  private parseKeyValueResponse(
    responseText: string,
  ): Record<string, string> {
    const result: Record<string, string> = {};

    responseText
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean)
      .forEach((line) => {
        const separatorIndex = line.indexOf(':');
        if (separatorIndex === -1) {
          return;
        }

        const key = line.slice(0, separatorIndex).trim();
        const value = line.slice(separatorIndex + 1).trim();

        if (key) {
          result[key] = value;
        }
      });

    return result;
  }
}
