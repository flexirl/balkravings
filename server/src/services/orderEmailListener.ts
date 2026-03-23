// ============================================================
// Kravings Kitchen — Server-Side Order Email Listener
// Listens for Supabase Realtime events on orders table and
// automatically sends order-confirmation & delivery emails.
// ============================================================

import { supabaseAdmin } from '../config/supabase';
import {
  sendOrderConfirmationEmail,
  sendOrderDeliveredEmail,
} from './emailService';

// Track orders we've already sent emails for (prevent duplicates on reconnect)
const sentConfirmations = new Set<string>();
const sentDeliveries = new Set<string>();

// Cap set size to prevent memory leak on long-running servers
const MAX_TRACKING_SIZE = 500;
function addToSet(set: Set<string>, id: string) {
  if (set.size >= MAX_TRACKING_SIZE) {
    const first = set.values().next().value;
    if (first) set.delete(first);
  }
  set.add(id);
}

// ─── Retry helper ──────────────────────────────────────────
async function withRetry<T>(
  fn: () => Promise<T>,
  label: string,
  maxAttempts = 3
): Promise<T> {
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      const msg = (error as Error).message || String(error);
      console.error(`[OrderEmail] ⚠️ ${label} — attempt ${attempt}/${maxAttempts} failed: ${msg}`);
      if (attempt === maxAttempts) throw error;
      // Exponential backoff: 2s, 4s
      const delay = Math.pow(2, attempt) * 1000;
      await new Promise(r => setTimeout(r, delay));
    }
  }
  throw new Error('Unreachable');
}

// ─── Send order confirmation email ─────────────────────────
async function handleNewOrder(orderId: string) {
  // Check duplicate BEFORE processing, but don't add to set yet
  if (sentConfirmations.has(orderId)) {
    console.log(`[OrderEmail] Skipping duplicate confirmation for ${orderId}`);
    return;
  }

  try {
    // Fetch order with items
    const { data: order, error: orderError } = await supabaseAdmin
      .from('orders')
      .select('*, order_items(*)')
      .eq('id', orderId)
      .single();

    if (orderError || !order) {
      console.error(`[OrderEmail] ❌ Order ${orderId} not found:`, orderError?.message);
      return;
    }

    // Get user email from auth
    const { data: { user: authUser } } = await supabaseAdmin.auth.admin.getUserById(order.user_id);
    const email = authUser?.email;

    if (!email) {
      console.error(`[OrderEmail] ❌ No email found for user ${order.user_id}`);
      return;
    }

    console.log(`[OrderEmail] 📧 Sending confirmation email for order ${orderId} to ${email}...`);

    const success = await withRetry(
      () => sendOrderConfirmationEmail({
        orderId: order.id,
        customerName: order.customer_name,
        email,
        items: (order.order_items || []).map((item: any) => ({
          name: item.name,
          quantity: item.quantity,
          price: item.price,
        })),
        totalAmount: order.total_amount,
        deliveryAddress: order.delivery_address,
        paymentMethod: order.payment_method,
        freebieItem: order.freebie_item || undefined,
      }),
      `Confirmation email for order ${orderId}`
    );

    if (success) {
      // Only mark as sent AFTER successful send
      addToSet(sentConfirmations, orderId);
      console.log(`[OrderEmail] ✅ Confirmation email sent for order ${orderId} to ${email}`);
    } else {
      console.error(`[OrderEmail] ❌ sendOrderConfirmationEmail returned false for order ${orderId}`);
    }
  } catch (error) {
    console.error(`[OrderEmail] ❌ All retries failed for confirmation email, order ${orderId}:`, (error as Error).message);
  }
}

// ─── Send delivery email ───────────────────────────────────
async function handleOrderDelivered(orderId: string) {
  if (sentDeliveries.has(orderId)) {
    console.log(`[OrderEmail] Skipping duplicate delivery email for ${orderId}`);
    return;
  }

  try {
    // Fetch order
    const { data: order, error: orderError } = await supabaseAdmin
      .from('orders')
      .select('id, customer_name, user_id')
      .eq('id', orderId)
      .single();

    if (orderError || !order) {
      console.error(`[OrderEmail] ❌ Order ${orderId} not found:`, orderError?.message);
      return;
    }

    // Get user email
    const { data: { user: authUser } } = await supabaseAdmin.auth.admin.getUserById(order.user_id);
    const email = authUser?.email;

    if (!email) {
      console.error(`[OrderEmail] ❌ No email found for user ${order.user_id}`);
      return;
    }

    console.log(`[OrderEmail] 📧 Sending delivery email for order ${orderId} to ${email}...`);

    const success = await withRetry(
      () => sendOrderDeliveredEmail(email, order.customer_name, order.id),
      `Delivery email for order ${orderId}`
    );

    if (success) {
      addToSet(sentDeliveries, orderId);
      console.log(`[OrderEmail] ✅ Delivery email sent for order ${orderId} to ${email}`);
    } else {
      console.error(`[OrderEmail] ❌ sendOrderDeliveredEmail returned false for order ${orderId}`);
    }
  } catch (error) {
    console.error(`[OrderEmail] ❌ All retries failed for delivery email, order ${orderId}:`, (error as Error).message);
  }
}

// ─── Start Realtime Listener with Auto-Reconnect ──────────
export function startOrderEmailListener() {
  console.log('[OrderEmail] 🔔 Starting order email listener...');

  let reconnectAttempts = 0;
  const MAX_RECONNECT_ATTEMPTS = 10;

  function subscribe() {
    const channel = supabaseAdmin
      .channel('order-email-events')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'orders' },
        (payload) => {
          const orderId = payload.new?.id;
          if (orderId) {
            console.log(`[OrderEmail] 🆕 New order detected: ${orderId}`);
            // Small delay to ensure order_items are inserted
            setTimeout(() => handleNewOrder(orderId), 3000);
          }
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'orders' },
        (payload) => {
          const orderId = payload.new?.id;
          const newStatus = payload.new?.order_status;
          const oldStatus = payload.old?.order_status;

          // Only send delivery email when status changes TO 'delivered'
          if (orderId && newStatus === 'delivered' && oldStatus !== 'delivered') {
            console.log(`[OrderEmail] 🚚 Order ${orderId} marked as delivered`);
            handleOrderDelivered(orderId);
          }
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          reconnectAttempts = 0; // Reset on successful connection
          console.log('[OrderEmail] ✅ Listening for order events (emails will fire automatically)');
        } else if (status === 'CHANNEL_ERROR') {
          console.error('[OrderEmail] ❌ Channel error — attempting reconnect...');
          // Auto-reconnect with exponential backoff
          if (reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
            reconnectAttempts++;
            const delay = Math.min(Math.pow(2, reconnectAttempts) * 1000, 30000);
            console.log(`[OrderEmail] 🔄 Reconnect attempt ${reconnectAttempts}/${MAX_RECONNECT_ATTEMPTS} in ${delay / 1000}s...`);
            setTimeout(() => {
              supabaseAdmin.removeChannel(channel);
              subscribe();
            }, delay);
          } else {
            console.error('[OrderEmail] ❌ Max reconnect attempts reached. Email listener is DOWN.');
          }
        } else if (status === 'CLOSED') {
          console.warn('[OrderEmail] ⚠️ Channel closed — attempting reconnect...');
          if (reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
            reconnectAttempts++;
            const delay = Math.min(Math.pow(2, reconnectAttempts) * 1000, 30000);
            setTimeout(() => {
              subscribe();
            }, delay);
          }
        }
      });

    return channel;
  }

  return subscribe();
}
