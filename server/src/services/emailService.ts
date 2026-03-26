// ============================================================
// Kravings Kitchen — Email Service (Brevo HTTP API + SMTP fallback)
// ============================================================

import nodemailer from 'nodemailer';
import {
  welcomeEmailTemplate,
  orderConfirmationTemplate,
  orderDeliveredTemplate,
  bulkMarketingTemplate,
} from './emailTemplates';

// ─── Interfaces ───────────────────────────────────────────
interface OrderItem {
  name: string;
  quantity: number;
  price: number;
}

interface OrderDetails {
  orderId: string;
  customerName: string;
  email: string;
  items: OrderItem[];
  totalAmount: number;
  deliveryAddress: string;
  paymentMethod: string;
  freebieItem?: string;
}

interface BulkEmailResult {
  total: number;
  sent: number;
  failed: number;
  errors: string[];
}

// ─── Brevo HTTP API (works on Render free plan) ───────────
const BREVO_API_KEY = process.env.BREVO_API_KEY || '';
const FROM_EMAIL = 'hello@kravingskitchen.in';
const FROM_NAME = 'Kravings Kitchen';
const FROM_ADDRESS = `"${FROM_NAME}" <${FROM_EMAIL}>`;

async function sendViaBrevoHTTP(
  to: string,
  subject: string,
  html: string
): Promise<boolean> {
  if (!BREVO_API_KEY) return false;

  try {
    const response = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'api-key': BREVO_API_KEY,
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        sender: { name: FROM_NAME, email: FROM_EMAIL },
        to: [{ email: to }],
        subject,
        htmlContent: html,
      }),
    });

    if (!response.ok) {
      const errBody = await response.text();
      console.error(`[Email] ❌ Brevo HTTP API error (${response.status}):`, errBody);
      return false;
    }

    const data = await response.json();
    console.log(`[Email] ✅ Sent via Brevo HTTP API to ${to} — messageId: ${data.messageId}`);
    return true;
  } catch (error: any) {
    console.error(`[Email] ❌ Brevo HTTP API exception:`, error.message);
    return false;
  }
}

// ─── SMTP Transporter (fallback for local dev) ────────────
const brevoTransporter = nodemailer.createTransport({
  host: 'smtp-relay.brevo.com',
  port: 587,
  secure: false,
  auth: {
    user: process.env.BREVO_USER || '',
    pass: process.env.BREVO_SMTP_KEY || '',
  },
});

// ─── Smart Send: HTTP API first, SMTP fallback ────────────
async function sendEmail(to: string, subject: string, html: string): Promise<boolean> {
  // Try Brevo HTTP API first (works on Render free plan)
  const httpResult = await sendViaBrevoHTTP(to, subject, html);
  if (httpResult) return true;

  // Fallback to SMTP (works locally)
  console.log(`[Email] Falling back to SMTP for ${to}`);
  try {
    const info = await brevoTransporter.sendMail({
      from: FROM_ADDRESS,
      to,
      subject,
      html,
    });
    console.log(`[Email] ✅ Sent via SMTP to ${to} — messageId: ${info.messageId}`);
    return true;
  } catch (error: any) {
    console.error(`[Email] ❌ SMTP also failed for ${to}:`, error.message);
    throw error;
  }
}

// ─── Verify connections on startup ─────────────────────────
export async function verifyEmailConnection(): Promise<boolean> {
  let httpOk = false;
  let smtpOk = false;

  // Check Brevo HTTP API
  if (BREVO_API_KEY) {
    try {
      const res = await fetch('https://api.brevo.com/v3/account', {
        headers: { 'api-key': BREVO_API_KEY },
      });
      if (res.ok) {
        const data = await res.json();
        console.log(`✅ Brevo HTTP API verified — plan: ${data.plan?.[0]?.type || 'free'}, credits: ${data.plan?.[0]?.credits || 'N/A'}`);
        httpOk = true;
      } else {
        console.error('❌ Brevo HTTP API key invalid:', res.status);
      }
    } catch (error: any) {
      console.error('❌ Brevo HTTP API check failed:', error.message);
    }
  } else {
    console.log('ℹ️  BREVO_API_KEY not set — HTTP API disabled, using SMTP only');
  }

  // Check SMTP
  try {
    await brevoTransporter.verify();
    console.log('✅ Brevo SMTP verified');
    smtpOk = true;
  } catch (error: any) {
    console.error('❌ Brevo SMTP failed:', error.message);
    if (httpOk) console.log('ℹ️  SMTP failed but HTTP API is available — emails will work');
  }

  return httpOk || smtpOk;
}

// ─── Send Welcome Email ─────────────────────────────────────
export async function sendWelcomeEmail(name: string, email: string): Promise<boolean> {
  console.log(`[Email] 📧 Sending welcome email to ${email}`);
  return sendEmail(email, `Welcome to Kravings Kitchen, ${name}! 🍔`, welcomeEmailTemplate(name));
}

// ─── Send Order Confirmation Email ──────────────────────────
export async function sendOrderConfirmationEmail(order: OrderDetails): Promise<boolean> {
  console.log(`[Email] 📧 Sending order confirmation to ${order.email} ORDER=${order.orderId}`);
  return sendEmail(
    order.email,
    `Order Confirmed ✅ #${order.orderId.slice(0, 8).toUpperCase()}`,
    orderConfirmationTemplate(order)
  );
}

// ─── Send Order Delivered Email ─────────────────────────────
export async function sendOrderDeliveredEmail(
  email: string,
  customerName: string,
  orderId: string
): Promise<boolean> {
  console.log(`[Email] 📧 Sending delivery email to ${email} ORDER=${orderId}`);
  return sendEmail(
    email,
    `Your order has been delivered! 🎉 #${orderId.slice(0, 8).toUpperCase()}`,
    orderDeliveredTemplate(customerName, orderId)
  );
}

// ─── Send Bulk Marketing Email ──────────────────────────────
export async function sendBulkEmail(
  subject: string,
  body: string,
  recipients: { email: string; name: string }[],
  imageUrl?: string
): Promise<BulkEmailResult> {
  const result: BulkEmailResult = { total: recipients.length, sent: 0, failed: 0, errors: [] };
  const htmlContent = bulkMarketingTemplate(subject, body, imageUrl);

  // Send in batches
  const BATCH_SIZE = 10;
  for (let i = 0; i < recipients.length; i += BATCH_SIZE) {
    const batch = recipients.slice(i, i + BATCH_SIZE);
    await Promise.all(batch.map(async (recipient) => {
      try {
        await sendEmail(recipient.email, subject, htmlContent);
        result.sent++;
      } catch (error) {
        result.failed++;
        result.errors.push(`${recipient.email}: ${(error as Error).message}`);
      }
    }));
    if (i + BATCH_SIZE < recipients.length) await new Promise(r => setTimeout(r, 1000));
  }
  return result;
}

