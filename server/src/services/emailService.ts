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

const FROM_ADDRESS = `"Kravings Kitchen" <${process.env.ZOHO_EMAIL || 'noreply@kravingskitchen.in'}>`;

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

// ─── Send Welcome Email (ZOHO) ─────────────────────────────
export async function sendWelcomeEmail(name: string, email: string): Promise<boolean> {
  try {
    await zohoTransporter.sendMail({
      from: FROM_ADDRESS,
      to: email,
      subject: `Welcome to Kravings Kitchen, ${name}! 🍔`,
      html: welcomeEmailTemplate(name),
    });
    console.log(`📧 Welcome email sent (Zoho) to ${email}`);
    return true;
  } catch (error) {
    console.error('Failed to send welcome email:', error);
    return false;
  }
}

// ─── Send Order Confirmation Email (BREVO) ──────────────────
export async function sendOrderConfirmationEmail(order: OrderDetails): Promise<boolean> {
  try {
    await brevoTransporter.sendMail({
      from: FROM_ADDRESS,
      to: order.email,
      subject: `Order Confirmed ✅ #${order.orderId.slice(0, 8).toUpperCase()}`,
      html: orderConfirmationTemplate(order),
    });
    console.log(`📧 Order confirmation sent (Brevo) to ${order.email}`);
    return true;
  } catch (error) {
    console.error('Failed to send order confirmation email:', error);
    return false;
  }
}

// ─── Send Order Delivered Email (BREVO) ─────────────────────
export async function sendOrderDeliveredEmail(
  email: string,
  customerName: string,
  orderId: string
): Promise<boolean> {
  try {
    await brevoTransporter.sendMail({
      from: FROM_ADDRESS,
      to: email,
      subject: `Your order has been delivered! 🎉 #${orderId.slice(0, 8).toUpperCase()}`,
      html: orderDeliveredTemplate(customerName, orderId),
    });
    console.log(`📧 Delivery email sent (Brevo) to ${email}`);
    return true;
  } catch (error) {
    console.error('Failed to send delivery email:', error);
    return false;
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
