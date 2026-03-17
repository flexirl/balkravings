// ============================================================
// Kravings Kitchen — Branded Email Templates
// ============================================================

const BRAND = '#af1d1d';
const BRAND_DEEP = '#8b1515';
const BRAND_DARK = '#1a1a1a';
const BRAND_LIGHT = '#fdf2f0';
const BRAND_ACCENT = '#d44040';
const LOGO_TEXT = 'KRAVINGS';
const TAGLINE = 'by ARF';
const WEBSITE_URL = 'https://www.kravingskitchen.in';

// ─── Base Template Wrapper ─────────────────────────────────
function baseTemplate(content: string, previewText: string = ''): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>Kravings Kitchen</title>
  ${previewText ? `<span style="display:none;max-height:0;overflow:hidden;mso-hide:all">${previewText}</span>` : ''}
</head>
<body style="margin:0;padding:0;background-color:#f0f0f0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f0f0f0;padding:24px 0;">
    <tr>
      <td align="center">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 32px rgba(0,0,0,0.08);">
          
          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(145deg, ${BRAND} 0%, ${BRAND_DEEP} 100%);padding:36px 24px;text-align:center;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center">
                    <div style="display:inline-block;border:2px solid rgba(255,255,255,0.3);border-radius:12px;padding:8px 28px;margin-bottom:8px;">
                      <h1 style="margin:0;color:#ffffff;font-size:30px;font-weight:900;letter-spacing:4px;font-family:'Segoe UI',Roboto,sans-serif;">${LOGO_TEXT}</h1>
                    </div>
                    <p style="margin:6px 0 0;color:rgba(255,255,255,0.75);font-size:11px;letter-spacing:3px;text-transform:uppercase;font-weight:500;">${TAGLINE}</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Maroon accent line -->
          <tr><td style="height:4px;background:linear-gradient(90deg, ${BRAND_ACCENT}, ${BRAND}, ${BRAND_DEEP});"></td></tr>
          
          <!-- Content -->
          <tr>
            <td style="padding:36px 28px;color:#333333;line-height:1.7;font-size:15px;">
              ${content}
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="padding:24px 28px;background:${BRAND_DARK};text-align:center;">
              <p style="margin:0 0 6px;"><a href="${WEBSITE_URL}" style="color:${BRAND_ACCENT};text-decoration:none;font-size:13px;font-weight:600;">${WEBSITE_URL.replace('https://', '')}</a></p>
              <p style="margin:0 0 4px;color:#888;font-size:12px;">📍 Bhubaneswar &nbsp;|&nbsp; 📞 +91 8018332575</p>
              <p style="margin:10px 0 0;color:#666;font-size:11px;">© ${new Date().getFullYear()} Kravings by ARF. All rights reserved.</p>
            </td>
          </tr>
          
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`.trim();
}

// ─── Styled Components ─────────────────────────────────────
function styledButton(text: string, url: string): string {
  return `
    <table role="presentation" cellpadding="0" cellspacing="0" style="margin:24px auto;">
      <tr>
        <td align="center" style="background:${BRAND};border-radius:12px;">
          <a href="${url}" target="_blank" style="display:inline-block;padding:14px 36px;color:#ffffff;text-decoration:none;font-weight:700;font-size:15px;letter-spacing:0.5px;border-radius:12px;background:linear-gradient(135deg, ${BRAND_ACCENT}, ${BRAND});">${text}</a>
        </td>
      </tr>
    </table>`;
}

function highlightBox(content: string): string {
  return `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:18px 0;">
      <tr>
        <td style="border-left:4px solid ${BRAND};background:${BRAND_LIGHT};padding:18px 22px;border-radius:0 12px 12px 0;">
          ${content}
        </td>
      </tr>
    </table>`;
}

function sectionHeading(emoji: string, title: string): string {
  return `
    <div style="text-align:center;margin-bottom:20px;">
      <div style="font-size:44px;margin-bottom:8px;">${emoji}</div>
      <h2 style="margin:0;color:${BRAND_DARK};font-size:24px;font-weight:800;">${title}</h2>
    </div>`;
}

// ─── Welcome Email ─────────────────────────────────────────
export function welcomeEmailTemplate(name: string): string {
  const content = `
    ${sectionHeading('🍔', `Welcome to Kravings, ${name}!`)}
    <p style="color:#555;font-size:15px;text-align:center;">We're thrilled to have you! Get ready for the most delicious food delivered straight to your doorstep in <strong style="color:${BRAND_DARK};">Bhubaneswar</strong>.</p>
    
    ${highlightBox(`
      <strong style="color:${BRAND_DARK};">🎁 What's waiting for you:</strong><br/>
      <span style="color:#555;">✅ Fresh, chef-crafted dishes</span><br/>
      <span style="color:#555;">✅ Lightning-fast delivery</span><br/>
      <span style="color:#555;">✅ Exclusive offers & discounts</span>
    `)}
    
    <p style="color:#555;font-size:15px;text-align:center;">Hungry already? Browse our menu and order now!</p>
    
    ${styledButton('🍕 Explore Menu', `${WEBSITE_URL}/menu`)}
    
    <p style="color:#999;font-size:12px;text-align:center;margin-top:20px;">If you have any questions, just reply to this email or reach us on WhatsApp!</p>
  `;
  return baseTemplate(content, `Welcome to Kravings Kitchen, ${name}! 🍔`);
}

// ─── Order Confirmation Email ──────────────────────────────
interface OrderItem {
  name: string;
  quantity: number;
  price: number;
}

interface OrderDetails {
  orderId: string;
  customerName: string;
  items: OrderItem[];
  totalAmount: number;
  deliveryAddress: string;
  paymentMethod: string;
  freebieItem?: string;
}

export function orderConfirmationTemplate(order: OrderDetails): string {
  const itemRows = order.items.map(item => `
    <tr>
      <td style="padding:12px 14px;border-bottom:1px solid #f0f0f0;font-size:14px;color:#444;">${item.name}</td>
      <td style="padding:12px 14px;border-bottom:1px solid #f0f0f0;text-align:center;font-size:14px;color:#666;">${item.quantity}</td>
      <td style="padding:12px 14px;border-bottom:1px solid #f0f0f0;text-align:right;font-size:14px;color:#444;font-weight:600;">₹${(item.price * item.quantity).toFixed(0)}</td>
    </tr>
  `).join('');

  const content = `
    ${sectionHeading('✅', 'Order Confirmed!')}
    <p style="color:#555;font-size:15px;">Hey <strong style="color:${BRAND_DARK};">${order.customerName}</strong>, your order has been placed successfully! We're preparing your food with love ❤️</p>
    
    ${highlightBox(`
      <strong style="color:${BRAND_DARK};">Order ID:</strong> <span style="color:${BRAND};font-weight:700;">#${order.orderId.slice(0, 8).toUpperCase()}</span><br/>
      <strong style="color:${BRAND_DARK};">Payment:</strong> <span style="color:#555;">${order.paymentMethod === 'cod' ? 'Cash on Delivery' : 'Online Payment'}</span>
    `)}
    
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:20px 0;border-radius:12px;overflow:hidden;border:1px solid #f0f0f0;">
      <thead>
        <tr style="background:${BRAND_LIGHT};">
          <th style="text-align:left;padding:12px 14px;color:${BRAND_DARK};font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;border-bottom:2px solid ${BRAND};">Item</th>
          <th style="text-align:center;padding:12px 14px;color:${BRAND_DARK};font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;border-bottom:2px solid ${BRAND};">Qty</th>
          <th style="text-align:right;padding:12px 14px;color:${BRAND_DARK};font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;border-bottom:2px solid ${BRAND};">Amount</th>
        </tr>
      </thead>
      <tbody>
        ${itemRows}
        ${order.freebieItem ? `
        <tr>
          <td style="padding:12px 14px;border-bottom:1px solid #f0f0f0;font-size:14px;color:#22c55e;font-weight:600;">🎁 ${order.freebieItem} (FREE)</td>
          <td style="padding:12px 14px;border-bottom:1px solid #f0f0f0;text-align:center;font-size:14px;color:#666;">1</td>
          <td style="padding:12px 14px;border-bottom:1px solid #f0f0f0;text-align:right;font-size:14px;color:#22c55e;font-weight:600;">₹0</td>
        </tr>
        ` : ''}
        <tr style="background:${BRAND_LIGHT};">
          <td colspan="2" style="padding:14px;font-weight:800;font-size:16px;color:${BRAND_DARK};border-top:2px solid ${BRAND};">Total</td>
          <td style="padding:14px;text-align:right;font-weight:800;font-size:18px;color:${BRAND};border-top:2px solid ${BRAND};">₹${order.totalAmount.toFixed(0)}</td>
        </tr>
      </tbody>
    </table>
    
    ${highlightBox(`
      <strong style="color:${BRAND_DARK};">📍 Delivery Address:</strong><br/>
      <span style="color:#555;">${order.deliveryAddress}</span>
    `)}
    
    ${styledButton('📦 Track Your Order', `${WEBSITE_URL}/orders`)}
    
    <p style="color:#999;font-size:12px;text-align:center;">Estimated delivery: 20-30 minutes. Sit back and relax! 😋</p>
  `;
  return baseTemplate(content, `Your order #${order.orderId.slice(0, 8).toUpperCase()} is confirmed! ✅`);
}

// ─── Order Delivered Email ─────────────────────────────────
export function orderDeliveredTemplate(customerName: string, orderId: string): string {
  const content = `
    ${sectionHeading('🎉', 'Order Delivered!')}
    <p style="color:#555;font-size:15px;">Hey <strong style="color:${BRAND_DARK};">${customerName}</strong>, your order <strong style="color:${BRAND};">#${orderId.slice(0, 8).toUpperCase()}</strong> has been delivered! We hope you love every bite 😋</p>
    
    ${highlightBox(`
      <strong style="color:${BRAND_DARK};">Enjoyed your meal?</strong><br/>
      <span style="color:#555;">Your feedback helps us serve you better! Come back for more anytime ❤️</span>
    `)}
    
    ${styledButton('🔄 Order Again', `${WEBSITE_URL}/menu`)}
    
    <p style="color:#999;font-size:12px;text-align:center;">Thank you for choosing Kravings! 🙏</p>
  `;
  return baseTemplate(content, `Your order has been delivered! 🎉`);
}

// ─── Bulk Marketing Email ──────────────────────────────────
export function bulkMarketingTemplate(subject: string, body: string, imageUrl?: string): string {
  const content = `
    ${sectionHeading('🔥', subject)}
    
    ${imageUrl ? `
    <div style="text-align:center;margin:20px 0;">
      <img src="${imageUrl}" alt="${subject}" style="max-width:100%;border-radius:12px;height:auto;border:1px solid #f0f0f0;" />
    </div>
    ` : ''}
    
    <div style="font-size:15px;color:#555;line-height:1.8;">
      ${body}
    </div>
    
    ${styledButton('🍕 Order Now', `${WEBSITE_URL}/menu`)}
    
    <hr style="border:none;border-top:1px solid #eee;margin:28px 0;" />
    <p style="color:#aaa;font-size:11px;text-align:center;line-height:1.6;">You are receiving this email because you have an account at Kravings Kitchen. If you wish to stop receiving promotional emails, please reply with "unsubscribe".</p>
  `;
  return baseTemplate(content, subject);
}
