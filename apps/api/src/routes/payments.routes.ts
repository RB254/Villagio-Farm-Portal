import { Router, Response } from 'express';
import { db } from '../db/database';
import { authenticateFarmer, authenticateAdmin, AuthenticatedRequest } from '../middleware/auth';
import { auditLog } from '../db/helpers';
import { notifyPaymentProcessed } from '../services/notification.service';

const router = Router();

// ============================================================
// GET /api/farmers/:id/payments
// ============================================================
router.get('/farmer/:farmerId', authenticateFarmer, (req: AuthenticatedRequest, res: Response) => {
  const requestedFarmerId = parseInt(req.params.farmerId);
  const user = req.user!;

  if (user.role !== 'ADMIN' && user.id !== requestedFarmerId) {
    res.status(403).json({ success: false, error: 'Access denied' });
    return;
  }

  const payments = db.prepare(`
    SELECT pay.*, fp.quantity, fp.unit, p.name as product_name
    FROM payments pay
    LEFT JOIN farmer_produce fp ON pay.produce_submission_id = fp.id
    LEFT JOIN products p ON fp.product_id = p.id
    WHERE pay.farmer_id = ?
    ORDER BY pay.created_at DESC
  `).all(requestedFarmerId);

  const totals = db.prepare(`
    SELECT
      SUM(CASE WHEN status = 'PENDING' THEN amount ELSE 0 END) as pending_total,
      SUM(CASE WHEN status = 'COMPLETED' THEN amount ELSE 0 END) as completed_total,
      COUNT(*) as total_count
    FROM payments WHERE farmer_id = ?
  `).get(requestedFarmerId) as any;

  res.json({ success: true, data: payments, totals });
});

// ============================================================
// POST /api/payments — Create payment (admin/system)
// ============================================================
router.post('/', authenticateAdmin, (req: AuthenticatedRequest, res: Response) => {
  const { farmer_id, produce_submission_id, amount, method = 'MPESA' } = req.body;

  if (!farmer_id || !amount) {
    res.status(400).json({ success: false, error: 'Required: farmer_id, amount' });
    return;
  }

  const farmer = db.prepare('SELECT * FROM farmers WHERE id = ?').get(farmer_id) as any;
  if (!farmer) {
    res.status(404).json({ success: false, error: 'Farmer not found' });
    return;
  }

  const result = db.prepare(`
    INSERT INTO payments (farmer_id, produce_submission_id, amount, currency, method, status)
    VALUES (?, ?, ?, 'KES', ?, 'PENDING')
  `).run(farmer_id, produce_submission_id || null, amount, method);

  auditLog('ADMIN', String(req.user!.id), 'PAYMENT_CREATED', 'payments', String(result.lastInsertRowid));

  res.status(201).json({ success: true, data: db.prepare('SELECT * FROM payments WHERE id = ?').get(result.lastInsertRowid) });
});

// ============================================================
// PUT /api/payments/:id/process — Simulate M-Pesa payment
// ============================================================
router.put('/:id/process', authenticateAdmin, (req: AuthenticatedRequest, res: Response) => {
  const id = parseInt(req.params.id);
  const payment = db.prepare('SELECT * FROM payments WHERE id = ?').get(id) as any;
  if (!payment) {
    res.status(404).json({ success: false, error: 'Payment not found' });
    return;
  }

  // Simulate M-Pesa transaction reference
  const transaction_reference = `MPESA-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;

  db.prepare(`
    UPDATE payments SET status = 'COMPLETED', transaction_reference = ?, updated_at = datetime('now')
    WHERE id = ?
  `).run(transaction_reference, id);

  const farmer = db.prepare('SELECT * FROM farmers WHERE id = ?').get(payment.farmer_id) as any;
  if (farmer) {
    notifyPaymentProcessed(payment.farmer_id, farmer.phone, payment.amount);
  }

  auditLog('ADMIN', String(req.user!.id), 'PAYMENT_PROCESSED', 'payments', String(id), { transaction_reference });

  res.json({
    success: true,
    message: 'Payment processed successfully (simulated M-Pesa)',
    data: db.prepare('SELECT * FROM payments WHERE id = ?').get(id),
  });
});

export default router;
