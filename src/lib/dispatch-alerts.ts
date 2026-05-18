import * as postmark from "postmark";
import { db } from "./db";
import { CHANNEL_LABELS } from "./utils";

interface SendForAlert {
  id: string;
  subject: string | null;
  channel: string;
  scheduledDate: Date | null;
  scheduledTime: string | null;
  campaign: { id: string; name: string };
  sendOwner: { id: string; name: string | null; email: string } | null;
}

interface Settings {
  alertHoursBefore: number;
  emailEnabled: boolean;
  slackEnabled: boolean;
  whatsappEnabled: boolean;
  postmarkApiKey: string | null;
  postmarkFromEmail: string | null;
  slackWebhookUrl: string | null;
  zApiInstanceId: string | null;
  zApiToken: string | null;
  zApiPhones: string | null;
}

function buildMessage(send: SendForAlert): { title: string; body: string } {
  const channel = CHANNEL_LABELS[send.channel] ?? send.channel;
  const subject = send.subject ?? "(sem assunto)";
  const date = send.scheduledDate
    ? new Intl.DateTimeFormat("pt-BR").format(send.scheduledDate)
    : "data não definida";
  const time = send.scheduledTime ?? "";

  return {
    title: `Disparo pendente: ${subject}`,
    body: `O disparo "${subject}" (${channel}) da campanha "${send.campaign.name}" está agendado para ${date}${time ? " às " + time : ""} e ainda não foi marcado como enviado.`,
  };
}

async function sendEmail(send: SendForAlert, settings: Settings) {
  if (!settings.postmarkApiKey || !settings.postmarkFromEmail || !send.sendOwner?.email) return;

  const client = new postmark.ServerClient(settings.postmarkApiKey);
  const { title, body } = buildMessage(send);
  const link = `${process.env.NEXTAUTH_URL ?? ""}/campaigns/${send.campaign.id}`;

  await client.sendEmail({
    From: settings.postmarkFromEmail,
    To: send.sendOwner.email,
    Subject: `[CampaignOps] ${title}`,
    HtmlBody: `
      <div style="font-family:sans-serif;max-width:560px;margin:0 auto">
        <h2 style="color:#ef4444">⚠️ ${title}</h2>
        <p style="color:#374151">${body}</p>
        <a href="${link}" style="display:inline-block;margin-top:16px;padding:10px 20px;background:#6366f1;color:#fff;border-radius:8px;text-decoration:none;font-weight:600">Ver disparo</a>
      </div>`,
    TextBody: `${title}\n\n${body}\n\nVer: ${link}`,
    MessageStream: "outbound",
  });
}

async function sendSlack(send: SendForAlert, settings: Settings) {
  if (!settings.slackWebhookUrl) return;
  const { title, body } = buildMessage(send);
  const link = `${process.env.NEXTAUTH_URL ?? ""}/campaigns/${send.campaign.id}`;

  await fetch(settings.slackWebhookUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      blocks: [
        {
          type: "section",
          text: {
            type: "mrkdwn",
            text: `⚠️ *${title}*\n${body}`,
          },
        },
        {
          type: "actions",
          elements: [
            {
              type: "button",
              text: { type: "plain_text", text: "Ver disparo" },
              url: link,
              style: "danger",
            },
          ],
        },
      ],
    }),
  });
}

async function sendWhatsApp(send: SendForAlert, settings: Settings) {
  if (!settings.zApiInstanceId || !settings.zApiToken || !settings.zApiPhones) return;

  const phones: string[] = JSON.parse(settings.zApiPhones);
  if (!phones.length) return;

  const { title, body } = buildMessage(send);
  const link = `${process.env.NEXTAUTH_URL ?? ""}/campaigns/${send.campaign.id}`;
  const message = `⚠️ *${title}*\n\n${body}\n\n🔗 ${link}`;
  const url = `https://api.z-api.io/instances/${settings.zApiInstanceId}/token/${settings.zApiToken}/send-text`;

  await Promise.allSettled(
    phones.map((phone) =>
      fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, message }),
      })
    )
  );
}

export async function dispatchAlerts(sends: SendForAlert[], settings: Settings) {
  const results = { notified: 0, errors: 0 };

  for (const send of sends) {
    try {
      const { title, body } = buildMessage(send);
      const link = `/campaigns/${send.campaign.id}`;

      // In-app notification
      if (send.sendOwner) {
        await db.notification.create({
          data: {
            userId: send.sendOwner.id,
            title,
            message: body,
            type: "warning",
            link,
            sendId: send.id,
          },
        });
      }

      // External channels (fire and forget — don't let one failure block others)
      const promises: Promise<void>[] = [];
      if (settings.emailEnabled) promises.push(sendEmail(send, settings).catch(console.error));
      if (settings.slackEnabled) promises.push(sendSlack(send, settings).catch(console.error));
      if (settings.whatsappEnabled) promises.push(sendWhatsApp(send, settings).catch(console.error));
      await Promise.allSettled(promises);

      // Mark send as alerted so we don't spam
      await db.send.update({
        where: { id: send.id },
        data: { alertSentAt: new Date() },
      });

      results.notified++;
    } catch (e) {
      console.error("dispatchAlerts error for send", send.id, e);
      results.errors++;
    }
  }

  return results;
}
