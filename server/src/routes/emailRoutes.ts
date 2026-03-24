// ============================================================
// Kravings Kitchen — Email API Routes
// ============================================================

import express from 'express';
import { protect, admin, AuthRequest } from '../middleware/authMiddleware';
import { supabaseAdmin } from '../config/supabase';
import {
  sendWelcomeEmail,
  sendOrderConfirmationEmail,
  sendOrderDeliveredEmail,
  sendBulkEmail,
} from '../services/emailService';

const router = express.Router();

// ─── Helpers ──────────────────────────────────────────────

// Build a userId → email map from auth.users (with pagination)
async function getUserEmailMap(): Promise<Map<string, string>> {
  const map = new Map<string, string>();
  let page = 1;
  const perPage = 1000;

  // Paginate through all users
  while (true) {
    const { data: { users }, error } = await supabaseAdmin.auth.admin.listUsers({ page, perPage });

    if (error) {
      console.error('[getUserEmailMap] listUsers error on page', page, ':', error.message);
      break;
    }

    for (const u of users) {
      if (u.email) map.set(u.id, u.email);
    }

    // If we got fewer than perPage, we've reached the end
    if (users.length < perPage) break;
    page++;
  }

  console.log(`[getUserEmailMap] Loaded ${map.size} user emails`);
  return map;
}

// Convert profiles + email map to recipients array
function toRecipients(
  profiles: { id: string; name: string | null }[],
  emailMap: Map<string, string>
): { email: string; name: string }[] {
  const recipients: { email: string; name: string }[] = [];
  for (const p of profiles) {
    const email = emailMap.get(p.id);
    if (email) recipients.push({ email, name: p.name || email.split('@')[0] });
  }
  return recipients;
}

// ─── Segment Definitions ──────────────────────────────────

interface Segment {
  key: string;
  label: string;
  icon: string;
  description: string;
}

const SEGMENT_DEFS: Segment[] = [
  { key: 'all',        label: 'All Customers',   icon: '👥', description: 'Every registered customer' },
  { key: 'top_orders', label: 'Top Orderers',     icon: '🏆', description: 'Top 50 by order count' },
  { key: 'big_spend',  label: 'Big Spenders',     icon: '💰', description: 'Top 50 by total spend' },
  { key: 'veg',        label: 'Veg Lovers',       icon: '🥬', description: 'Mostly order veg items' },
  { key: 'nonveg',     label: 'Non-Veg Lovers',   icon: '🍗', description: 'Mostly order non-veg items' },
  { key: 'new_users',  label: 'New Users',        icon: '🆕', description: 'Signed up in last 14 days' },
  { key: 'inactive',   label: 'Inactive Users',   icon: '😴', description: 'No order in 30+ days' },
];

// Compute recipients for a specific segment
async function getSegmentRecipients(
  segmentKey: string,
  emailMap: Map<string, string>
): Promise<{ email: string; name: string }[]> {
  const LIMIT = 50;

  switch (segmentKey) {
    case 'all': {
      const { data } = await supabaseAdmin.from('profiles').select('id, name').eq('role', 'user');
      return toRecipients(data || [], emailMap);
    }

    case 'top_orders': {
      // Users with most orders, top 50
      const { data: orders } = await supabaseAdmin
        .from('orders')
        .select('user_id');

      if (!orders || orders.length === 0) return [];

      // Count orders per user
      const counts = new Map<string, number>();
      for (const o of orders) {
        counts.set(o.user_id, (counts.get(o.user_id) || 0) + 1);
      }

      // Sort by count descending, take top 50
      const topUserIds = [...counts.entries()]
        .sort((a, b) => b[1] - a[1])
        .slice(0, LIMIT)
        .map(([uid]) => uid);

      const { data: profiles } = await supabaseAdmin
        .from('profiles')
        .select('id, name')
        .in('id', topUserIds);

      return toRecipients(profiles || [], emailMap);
    }

    case 'big_spend': {
      // Users with highest total spend, top 50
      const { data: orders } = await supabaseAdmin
        .from('orders')
        .select('user_id, total_amount');

      if (!orders || orders.length === 0) return [];

      const totals = new Map<string, number>();
      for (const o of orders) {
        totals.set(o.user_id, (totals.get(o.user_id) || 0) + Number(o.total_amount));
      }

      const topUserIds = [...totals.entries()]
        .sort((a, b) => b[1] - a[1])
        .slice(0, LIMIT)
        .map(([uid]) => uid);

      const { data: profiles } = await supabaseAdmin
        .from('profiles')
        .select('id, name')
        .in('id', topUserIds);

      return toRecipients(profiles || [], emailMap);
    }

    case 'veg':
    case 'nonveg': {
      const isVegSegment = segmentKey === 'veg';

      // Get all order items with food veg classification
      const { data: orderItems } = await supabaseAdmin
        .from('order_items')
        .select('order_id, food_id');

      const { data: foods } = await supabaseAdmin
        .from('foods')
        .select('id, is_veg');

      const { data: orders } = await supabaseAdmin
        .from('orders')
        .select('id, user_id');

      if (!orderItems || !foods || !orders) return [];

      // Food veg map
      const foodVegMap = new Map(foods.map(f => [f.id, f.is_veg !== false]));
      // Order → user map
      const orderUserMap = new Map(orders.map(o => [o.id, o.user_id]));

      // Count veg vs total items per user
      const userStats = new Map<string, { veg: number; total: number }>();
      for (const item of orderItems) {
        const userId = orderUserMap.get(item.order_id);
        if (!userId) continue;
        const isVeg = foodVegMap.get(item.food_id) ?? true;
        const stats = userStats.get(userId) || { veg: 0, total: 0 };
        stats.total++;
        if (isVeg) stats.veg++;
        userStats.set(userId, stats);
      }

      // Filter: >60% veg or >60% non-veg
      const qualifiedUserIds = [...userStats.entries()]
        .filter(([, s]) => {
          if (s.total === 0) return false;
          const vegRatio = s.veg / s.total;
          return isVegSegment ? vegRatio > 0.6 : vegRatio < 0.4;
        })
        .slice(0, LIMIT)
        .map(([uid]) => uid);

      if (qualifiedUserIds.length === 0) return [];

      const { data: profiles } = await supabaseAdmin
        .from('profiles')
        .select('id, name')
        .in('id', qualifiedUserIds);

      return toRecipients(profiles || [], emailMap);
    }

    case 'new_users': {
      // Users who signed up in last 14 days
      const fourteenDaysAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString();

      const { data: profiles } = await supabaseAdmin
        .from('profiles')
        .select('id, name, created_at')
        .eq('role', 'user')
        .gte('created_at', fourteenDaysAgo)
        .order('created_at', { ascending: false })
        .limit(LIMIT);

      return toRecipients(profiles || [], emailMap);
    }

    case 'inactive': {
      // Users who have ordered before but not in last 30 days
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

      // Get ALL users who have ever ordered
      const { data: allOrders } = await supabaseAdmin
        .from('orders')
        .select('user_id, created_at');

      if (!allOrders || allOrders.length === 0) return [];

      // Find users whose LATEST order is older than 30 days
      const latestOrder = new Map<string, string>();
      for (const o of allOrders) {
        const prev = latestOrder.get(o.user_id);
        if (!prev || o.created_at > prev) {
          latestOrder.set(o.user_id, o.created_at);
        }
      }

      const inactiveUserIds = [...latestOrder.entries()]
        .filter(([, lastDate]) => lastDate < thirtyDaysAgo)
        .slice(0, LIMIT)
        .map(([uid]) => uid);

      if (inactiveUserIds.length === 0) return [];

      const { data: profiles } = await supabaseAdmin
        .from('profiles')
        .select('id, name')
        .in('id', inactiveUserIds);

      return toRecipients(profiles || [], emailMap);
    }

    default:
      return [];
  }
}


// ─── POST /api/email/welcome ───────────────────────────────
router.post('/welcome', async (req, res) => {
  try {
    const { name, email } = req.body;

    if (!name || !email) {
      return res.status(400).json({ message: 'Name and email are required' });
    }

    const success = await sendWelcomeEmail(name, email);
    res.json({ success, message: success ? 'Welcome email sent' : 'Failed to send email' });
  } catch (error) {
    console.error('Welcome email route error:', error);
    res.status(500).json({ message: 'Failed to send welcome email' });
  }
});

// ─── POST /api/email/order-confirmation ────────────────────
router.post('/order-confirmation', protect as any, async (req: AuthRequest, res) => {
  console.log('[EmailRoute] 📨 /order-confirmation hit — orderId:', req.body?.orderId, 'user:', req.user?.email);
  try {
    const { orderId } = req.body;

    if (!orderId) {
      return res.status(400).json({ message: 'Order ID is required' });
    }

    const { data: order, error: orderError } = await supabaseAdmin
      .from('orders')
      .select('*, order_items(*)')
      .eq('id', orderId)
      .single();

    if (orderError || !order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    const { data: { user: authUser } } = await supabaseAdmin.auth.admin.getUserById(order.user_id);
    const email = authUser?.email;

    if (!email) {
      return res.status(400).json({ message: 'User email not found' });
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

    res.json({ success, message: success ? 'Order confirmation email sent' : 'Failed to send email' });
  } catch (error) {
    console.error('Order confirmation email route error:', error);
    res.status(500).json({ message: 'Failed to send order confirmation email' });
  }
});

// ─── POST /api/email/order-delivered ───────────────────────
router.post('/order-delivered', protect as any, admin as any, async (req: AuthRequest, res) => {
  console.log('[EmailRoute] 📨 /order-delivered hit — orderId:', req.body?.orderId, 'user:', req.user?.email);
  try {
    const { orderId } = req.body;

    if (!orderId) {
      return res.status(400).json({ message: 'Order ID is required' });
    }

    const { data: order, error: orderError } = await supabaseAdmin
      .from('orders')
      .select('id, customer_name, user_id')
      .eq('id', orderId)
      .single();

    if (orderError || !order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    const { data: { user: authUser } } = await supabaseAdmin.auth.admin.getUserById(order.user_id);
    const email = authUser?.email;

    if (!email) {
      return res.status(400).json({ message: 'User email not found' });
    }

    const success = await sendOrderDeliveredEmail(email, order.customer_name, order.id);
    res.json({ success, message: success ? 'Delivery email sent' : 'Failed to send email' });
  } catch (error) {
    console.error('Order delivered email route error:', error);
    res.status(500).json({ message: 'Failed to send delivery email' });
  }
});

// ─── GET /api/email/customers ──────────────────────────────
router.get('/customers', protect as any, admin as any, async (req: AuthRequest, res) => {
  try {
    const { data: profiles, error } = await supabaseAdmin
      .from('profiles')
      .select('id, name')
      .eq('role', 'user');

    if (error) throw error;

    const emailMap = await getUserEmailMap();
    const customers = toRecipients(profiles || [], emailMap);

    res.json({ customers, total: customers.length });
  } catch (error) {
    console.error('Fetch customers error:', error);
    res.status(500).json({ message: 'Failed to fetch customers' });
  }
});

// ─── GET /api/email/segments ──────────────────────────────
// Returns all segment definitions with live recipient counts
router.get('/segments', protect as any, admin as any, async (req: AuthRequest, res) => {
  try {
    console.log('[Segments] Fetching email map...');
    const emailMap = await getUserEmailMap();
    console.log('[Segments] Email map loaded, computing segment counts...');

    const segmentsWithCounts = await Promise.all(
      SEGMENT_DEFS.map(async (seg) => {
        try {
          const recipients = await getSegmentRecipients(seg.key, emailMap);
          return { ...seg, count: recipients.length };
        } catch (segErr) {
          console.error(`[Segments] Error computing segment "${seg.key}":`, segErr);
          return { ...seg, count: 0 };
        }
      })
    );

    console.log('[Segments] Done. Counts:', segmentsWithCounts.map(s => `${s.key}:${s.count}`).join(', '));
    res.json({ segments: segmentsWithCounts });
  } catch (error: any) {
    console.error('[Segments] FATAL error:', error?.message || error, error?.stack);
    res.status(500).json({ message: 'Failed to fetch segments', error: error?.message });
  }
});

// ─── POST /api/email/bulk ──────────────────────────────────
// Admin only — send bulk marketing email (optionally to a specific segment)
router.post('/bulk', protect as any, admin as any, async (req: AuthRequest, res) => {
  try {
    const { subject, body, imageUrl, segment } = req.body;

    if (!subject || !body) {
      return res.status(400).json({ message: 'Subject and body are required' });
    }

    const emailMap = await getUserEmailMap();
    const segmentKey = segment || 'all';

    const recipients = await getSegmentRecipients(segmentKey, emailMap);

    if (recipients.length === 0) {
      return res.status(400).json({ message: 'No recipients found for this segment' });
    }

    console.log(`[BulkEmail] Sending to segment "${segmentKey}" — ${recipients.length} recipients`);

    const result = await sendBulkEmail(subject, body, recipients, imageUrl);

    res.json({
      success: true,
      message: `Bulk email completed: ${result.sent}/${result.total} sent`,
      result,
    });
  } catch (error) {
    console.error('Bulk email route error:', error);
    res.status(500).json({ message: 'Failed to send bulk email' });
  }
});

export default router;
