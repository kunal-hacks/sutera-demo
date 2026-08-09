/**
 * NOTIFICATION SERVICE (abstraction only)
 * ----------------------------------------
 * Phase 1 does not send real WhatsApp/SMS/email notifications. This module
 * defines the events the rest of the app already emits, so a real provider
 * (WhatsApp Business API, Twilio, MSG91, an email service, etc.) can be
 * dropped in later by implementing `NotificationChannel` and registering
 * it in `channels` below — no call sites elsewhere in the app need to change.
 */

export type NotificationEvent =
  | { type: "ORDER_CONFIRMED"; orderNumber: string; phone: string; email: string }
  | { type: "PAYMENT_SUCCESSFUL"; orderNumber: string; phone: string; email: string }
  | { type: "ORDER_PROCESSING"; orderNumber: string; phone: string; email: string }
  | { type: "ORDER_SHIPPED"; orderNumber: string; phone: string; email: string }
  | { type: "ORDER_DELIVERED"; orderNumber: string; phone: string; email: string }
  | { type: "ORDER_CANCELLED"; orderNumber: string; phone: string; email: string };

interface NotificationChannel {
  name: string;
  send(event: NotificationEvent): Promise<void>;
}

/** Demo channel — simply logs to the server console. Replace/extend `channels` in production. */
const consoleChannel: NotificationChannel = {
  name: "console-demo",
  async send(event) {
    // eslint-disable-next-line no-console
    console.log(`[notify:${event.type}] order=${event.orderNumber} ->`, event);
  },
};

const channels: NotificationChannel[] = [consoleChannel];

export async function notify(event: NotificationEvent): Promise<void> {
  await Promise.all(channels.map((c) => c.send(event).catch(() => undefined)));
}
