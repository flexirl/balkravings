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

// ─── POST /api/email/welcome ───────────────────────────────
// Triggered after user signup — sends welcome email
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
// Triggered after order placement — sends order details
router.post('/order-confirmation', protect as any, async (req: AuthRequest, res) => {
  try {
    const { orderId } = req.body;

    if (!orderId) {
      return res.status(400).json({ message: 'Order ID is required' });
    }

    // Fetch order with items from Supabase
    const { data: order, error: orderError } = await supabaseAdmin
      .from('orders')
      .select('*, order_items(*)')
      .eq('id', orderId)
      .single();

    if (orderError || !order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Get user email
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
// Triggered by admin when order status → delivered
router.post('/order-delivered', protect as any, admin as any, async (req: AuthRequest, res) => {
  try {
    const { orderId } = req.body;

    if (!orderId) {
      return res.status(400).json({ message: 'Order ID is required' });
    }

    // Fetch order
    const { data: order, error: orderError } = await supabaseAdmin
      .from('orders')
      .select('id, customer_name, user_id')
      .eq('id', orderId)
      .single();

    if (orderError || !order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Get user email
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
// Admin only — get all customer emails for bulk send
router.get('/customers', protect as any, admin as any, async (req: AuthRequest, res) => {
  try {
    // Fetch all user profiles with their emails from auth
    const { data: profiles, error } = await supabaseAdmin
      .from('profiles')
      .select('id, name')
      .eq('role', 'user');

    if (error) throw error;

    // Get emails from auth.users for each profile
    const customers: { email: string; name: string }[] = [];

    if (profiles) {
      // Batch fetch — get all users from auth admin
      const { data: { users } } = await supabaseAdmin.auth.admin.listUsers({ perPage: 1000 });

      const userMap = new Map(users.map(u => [u.id, u.email]));

      for (const profile of profiles) {
        const email = userMap.get(profile.id);
        if (email) {
          customers.push({ email, name: profile.name || email.split('@')[0] });
        }
      }
    }

    res.json({ customers, total: customers.length });
  } catch (error) {
    console.error('Fetch customers error:', error);
    res.status(500).json({ message: 'Failed to fetch customers' });
  }
});

// ─── POST /api/email/bulk ──────────────────────────────────
// Admin only — send bulk marketing email to all customers
router.post('/bulk', protect as any, admin as any, async (req: AuthRequest, res) => {
  try {
    const { subject, body, imageUrl } = req.body;

    if (!subject || !body) {
      return res.status(400).json({ message: 'Subject and body are required' });
    }

    // Fetch all customer emails
    const { data: profiles } = await supabaseAdmin
      .from('profiles')
      .select('id, name')
      .eq('role', 'user');

    if (!profiles || profiles.length === 0) {
      return res.status(400).json({ message: 'No customers found' });
    }

    // Get emails from auth
    const { data: { users } } = await supabaseAdmin.auth.admin.listUsers({ perPage: 1000 });
    const userMap = new Map(users.map(u => [u.id, u.email]));

    const recipients: { email: string; name: string }[] = [];
    for (const profile of profiles) {
      const email = userMap.get(profile.id);
      if (email) {
        recipients.push({ email, name: profile.name || email.split('@')[0] });
      }
    }

    if (recipients.length === 0) {
      return res.status(400).json({ message: 'No valid email addresses found' });
    }

    // Send bulk email (this runs in background, respond immediately with started status)
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
