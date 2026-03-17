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

// ─── Send order confirmation email ─────────────────────────
async function handleNewOrder(orderId: string) {
  if (sentConfirmations.has(orderId)) return;
  addToSet(sentConfirmations, orderId);

  try {
    // Fetch order with items
    const { data: order, error: orderError } = await supabaseAdmin
      .from('orders')
      .select('*, order_items(*)')
      .eq('id', orderId)
      .single();

    if (orderError || !order) {
      console.error(`[OrderEmail] Order ${orderId} not found:`, orderError?.message);
      return;
    }

    // Get user email from auth
    const { data: { user: authUser } } = await supabaseAdmin.auth.admin.getUserById(order.user_id);
    const email = authUser?.email;

    if (!email) {
      console.error(`[OrderEmail] No email found for user ${order.user_id}`);
      return;
    }

    const success = await sendOrderConfirmationEmail({
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
    });

    if (success) {
      console.log(`[OrderEmail] ✅ Confirmation email sent for order ${orderId}`);
    } else {
      console.error(`[OrderEmail] ❌ Failed to send confirmation email for order ${orderId}`);
    }
  } catch (error) {
    console.error(`[OrderEmail] Error sending confirmation email for order ${orderId}:`, error);
  }
}

// ─── Send delivery email ───────────────────────────────────
async function handleOrderDelivered(orderId: string) {
  if (sentDeliveries.has(orderId)) return;
  addToSet(sentDeliveries, orderId);

  try {
    // Fetch order
    const { data: order, error: orderError } = await supabaseAdmin
      .from('orders')
      .select('id, customer_name, user_id')
      .eq('id', orderId)
      .single();

    if (orderError || !order) {
      console.error(`[OrderEmail] Order ${orderId} not found:`, orderError?.message);
      return;
    }

    // Get user email
    const { data: { user: authUser } } = await supabaseAdmin.auth.admin.getUserById(order.user_id);
    const email = authUser?.email;

    if (!email) {
      console.error(`[OrderEmail] No email found for user ${order.user_id}`);
      return;
    }

    const success = await sendOrderDeliveredEmail(email, order.customer_name, order.id);

    if (success) {
      console.log(`[OrderEmail] ✅ Delivery email sent for order ${orderId}`);
    } else {
      console.error(`[OrderEmail] ❌ Failed to send delivery email for order ${orderId}`);
    }
  } catch (error) {
    console.error(`[OrderEmail] Error sending delivery email for order ${orderId}:`, error);
  }
}

// ─── Start Realtime Listener ──────────────────────────────
export function startOrderEmailListener() {
  console.log('[OrderEmail] 🔔 Starting order email listener...');

  const channel = supabaseAdmin
    .channel('order-email-events')
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'orders' },
      (payload) => {
        const orderId = payload.new?.id;
        if (orderId) {
          console.log(`[OrderEmail] New order detected: ${orderId}`);
          // Small delay to ensure order_items are inserted
          setTimeout(() => handleNewOrder(orderId), 2000);
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
          console.log(`[OrderEmail] Order ${orderId} marked as delivered`);
          handleOrderDelivered(orderId);
        }
      }
    )
    .subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        console.log('[OrderEmail] ✅ Listening for order events (emails will fire automatically)');
      } else if (status === 'CHANNEL_ERROR') {
        console.error('[OrderEmail] ❌ Channel error — will retry...');
      }
    });

  return channel;
}
