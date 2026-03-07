import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as crypto from 'crypto';

@Injectable()
export class WebhookDispatcherService {
  private readonly logger = new Logger(WebhookDispatcherService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * Dispatch an event to all matching webhooks for an organization.
   * Fire-and-forget — errors never block the caller.
   */
  async dispatch(event: string, organizationId: string, payload: any) {
    try {
      const webhooks = await this.prisma.webhook.findMany({
        where: {
          organizationId,
          isActive: true,
          events: { has: event },
        },
      });

      for (const webhook of webhooks) {
        this.sendWebhook(webhook, event, payload).catch((err) => {
          this.logger.error(`Webhook ${webhook.id} dispatch error: ${err.message}`);
        });
      }
    } catch (error) {
      this.logger.error(`Error dispatching event ${event}: ${error.message}`);
    }
  }

  private async sendWebhook(
    webhook: { id: string; url: string; secret: string | null; maxRetries: number },
    event: string,
    payload: any,
    attempt = 1,
  ) {
    const body = JSON.stringify({ event, data: payload, timestamp: new Date().toISOString() });

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'X-Webhook-Event': event,
    };

    // HMAC signature
    if (webhook.secret) {
      const signature = crypto
        .createHmac('sha256', webhook.secret)
        .update(body)
        .digest('hex');
      headers['X-Webhook-Signature'] = `sha256=${signature}`;
    }

    try {
      const response = await fetch(webhook.url, {
        method: 'POST',
        headers,
        body,
        signal: AbortSignal.timeout(10000),
      });

      const responseBody = await response.text().catch(() => '');

      await this.prisma.webhookLog.create({
        data: {
          webhookId: webhook.id,
          event,
          payload: payload as any,
          statusCode: response.status,
          responseBody: responseBody.slice(0, 1000),
          attempt,
          success: response.ok,
        },
      });

      if (!response.ok && attempt < webhook.maxRetries) {
        const delay = Math.pow(2, attempt) * 1000; // Exponential backoff
        setTimeout(() => {
          this.sendWebhook(webhook, event, payload, attempt + 1);
        }, delay);
      }
    } catch (error) {
      await this.prisma.webhookLog.create({
        data: {
          webhookId: webhook.id,
          event,
          payload: payload as any,
          attempt,
          success: false,
          error: error.message,
        },
      });

      if (attempt < webhook.maxRetries) {
        const delay = Math.pow(2, attempt) * 1000;
        setTimeout(() => {
          this.sendWebhook(webhook, event, payload, attempt + 1);
        }, delay);
      }
    }
  }
}
