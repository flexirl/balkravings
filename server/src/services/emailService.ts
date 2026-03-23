// ============================================================
// Kravings Kitchen — Email Service (Nodemailer + Zoho SMTP)
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

// ─── SMTP Transporters ────────────────────────────────────

// (1) Zoho Transporter — Used for Welcome Emails (Personal Touch)
const zohoTransporter = nodemailer.createTransport({
  host: 'smtp.zoho.in',
  port: 465,
  secure: true,
  auth: {
    user: process.env.ZOHO_EMAIL || '',
    pass: process.env.ZOHO_PASSWORD || '',
  },
});

// (2) Brevo Transporter — Used for Orders & Bulk (300/day free)
const brevoTransporter = nodemailer.createTransport({
  host: 'smtp-relay.brevo.com',
  port: 587,
  secure: false, // TLS
  auth: {
    user: process.env.BREVO_USER || '', 
    pass: process.env.BREVO_SMTP_KEY || '', 
  },
});

// Use explicit sender email for Brevo to match verified sender identity
const FROM_ADDRESS = `"Kravings Kitchen" <hello@kravingskitchen.in>`;
// ─── Verify SMTP connections on startup ─────────────────────
export async function verifyEmailConnection(): Promise<boolean> {
  let zohoOk = false;
  let brevoOk = false;

  try {
    await zohoTransporter.verify();
    console.log('✅ Zoho SMTP (Welcome Emails) verified');
    zohoOk = true;
  } catch (error) {
    console.error('❌ Zoho SMTP failed:', (error as Error).message);
  }

  try {
    await brevoTransporter.verify();
    console.log('✅ Brevo SMTP (Orders & Bulk) verified');
    brevoOk = true;
  } catch (error) {
    console.error('❌ Brevo SMTP failed:', (error as Error).message);
  }

  return zohoOk && brevoOk; 
}

// ─── Send Welcome Email (BREVO) ─────────────────────────────
export async function sendWelcomeEmail(name: string, email: string): Promise<boolean> {
  console.log(`[Email] 📧 Sending welcome email: FROM=${FROM_ADDRESS} TO=${email}`);
  try {
    const info = await brevoTransporter.sendMail({
      from: FROM_ADDRESS,
      to: email,
      subject: `Welcome to Kravings Kitchen, ${name}! 🍔`,
      html: welcomeEmailTemplate(name),
    });
    console.log(`[Email] ✅ Welcome email sent to ${email} — messageId: ${info.messageId}`);
    return true;
  } catch (error: any) {
    console.error(`[Email] ❌ Welcome email FAILED to ${email}:`, {
      message: error.message,
      code: error.code,
      responseCode: error.responseCode,
      response: error.response,
    });
    throw error; // Re-throw so retry logic can catch it
  }
}

// ─── Send Order Confirmation Email (BREVO) ──────────────────
export async function sendOrderConfirmationEmail(order: OrderDetails): Promise<boolean> {
  console.log(`[Email] 📧 Sending order confirmation: FROM=${FROM_ADDRESS} TO=${order.email} ORDER=${order.orderId}`);
  try {
    const info = await brevoTransporter.sendMail({
      from: FROM_ADDRESS,
      to: order.email,
      subject: `Order Confirmed ✅ #${order.orderId.slice(0, 8).toUpperCase()}`,
      html: orderConfirmationTemplate(order),
    });
    console.log(`[Email] ✅ Order confirmation sent to ${order.email} — messageId: ${info.messageId}`);
    return true;
  } catch (error: any) {
    console.error(`[Email] ❌ Order confirmation FAILED to ${order.email}:`, {
      message: error.message,
      code: error.code,
      responseCode: error.responseCode,
      response: error.response,
    });
    throw error;
  }
}

// ─── Send Order Delivered Email (BREVO) ─────────────────────
export async function sendOrderDeliveredEmail(
  email: string,
  customerName: string,
  orderId: string
): Promise<boolean> {
  console.log(`[Email] 📧 Sending delivery email: FROM=${FROM_ADDRESS} TO=${email} ORDER=${orderId}`);
  try {
    const info = await brevoTransporter.sendMail({
      from: FROM_ADDRESS,
      to: email,
      subject: `Your order has been delivered! 🎉 #${orderId.slice(0, 8).toUpperCase()}`,
      html: orderDeliveredTemplate(customerName, orderId),
    });
    console.log(`[Email] ✅ Delivery email sent to ${email} — messageId: ${info.messageId}`);
    return true;
  } catch (error: any) {
    console.error(`[Email] ❌ Delivery email FAILED to ${email}:`, {
      message: error.message,
      code: error.code,
      responseCode: error.responseCode,
      response: error.response,
    });
    throw error;
  }
}

// ─── Send Bulk Marketing Email (BREVO) ──────────────────────
export async function sendBulkEmail(
  subject: string,
  body: string,
  recipients: { email: string; name: string }[],
  imageUrl?: string
): Promise<BulkEmailResult> {
  const result: BulkEmailResult = { total: recipients.length, sent: 0, failed: 0, errors: [] };
  const htmlContent = bulkMarketingTemplate(subject, body, imageUrl);

  // Send in batches to be safe
  const BATCH_SIZE = 10;
  for (let i = 0; i < recipients.length; i += BATCH_SIZE) {
    const batch = recipients.slice(i, i + BATCH_SIZE);
    await Promise.all(batch.map(async (recipient) => {
      try {
        await brevoTransporter.sendMail({
          from: FROM_ADDRESS,
          to: recipient.email,
          subject,
          html: htmlContent,
        });
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
