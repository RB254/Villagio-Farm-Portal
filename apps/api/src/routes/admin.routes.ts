import { Router, Request, Response } from 'express';
import { db } from '../db/database';
import { authenticateAdmin, AuthenticatedRequest } from '../middleware/auth';
import { generateExceptionId, auditLog } from '../db/helpers';

const router = Router();

// ============================================================
// GET /api/admin/dashboard
// ============================================================
router.get('/dashboard', authenticateAdmin, (_req: Request, res: Response) => {
  const farmers = db.prepare("SELECT COUNT(*) as total, SUM(CASE WHEN status = 'ACTIVE' THEN 1 ELSE 0 END) as active FROM farmers").get() as any;
  const produce = db.prepare('SELECT COUNT(*) as total FROM farmer_produce').get() as any;
  const availableSupply = db.prepare("SELECT SUM(quantity) as total FROM farmer_produce WHERE status IN ('SUBMITTED','AVAILABLE')").get() as any;
  const expectedSupply = db.prepare("SELECT SUM(quantity) as total FROM farmer_produce WHERE status NOT IN ('COMPLETED','SOLD')").get() as any;
  const collections = db.prepare(`
    SELECT
      SUM(CASE WHEN status = 'REQUESTED' THEN 1 ELSE 0 END) as pending,
      SUM(CASE WHEN status IN ('ACCEPTED','VEHICLE_ASSIGNED','ROUTE_PLANNED') THEN 1 ELSE 0 END) as scheduled,
      SUM(CASE WHEN status = 'COMPLETED' THEN 1 ELSE 0 END) as completed
    FROM collection_requests
  `).get() as any;
  const payments = db.prepare(`
    SELECT
      SUM(CASE WHEN status = 'PENDING' THEN amount ELSE 0 END) as pending_amount,
      SUM(CASE WHEN status = 'COMPLETED' THEN amount ELSE 0 END) as completed_amount,
      COUNT(*) as total
    FROM payments
  `).get() as any;
  const exceptions = db.prepare("SELECT COUNT(*) as total, SUM(CASE WHEN status = 'OPEN' THEN 1 ELSE 0 END) as open FROM exceptions").get() as any;
  const smsCount = db.prepare('SELECT COUNT(*) as count FROM sms_log').get() as any;

  // Recent activity
  const recentProduce = db.prepare(`
    SELECT fp.submission_id, fp.quantity, fp.unit, fp.status, fp.source_channel,
           p.name as product_name, f.full_name as farmer_name, fp.created_at
    FROM farmer_produce fp
    JOIN products p ON fp.product_id = p.id
    JOIN farmers f ON fp.farmer_id = f.id
    ORDER BY fp.created_at DESC LIMIT 10
  `).all();

  res.json({
    success: true,
    data: {
      farmers: { total: farmers.total, active: farmers.active },
      produce: { total: produce.total },
      supply: { available: availableSupply.total || 0, expected: expectedSupply.total || 0 },
      collections: { pending: collections.pending || 0, scheduled: collections.scheduled || 0, completed: collections.completed || 0 },
      payments: { pending_amount: payments.pending_amount || 0, completed_amount: payments.completed_amount || 0, total: payments.total || 0 },
      exceptions: { total: exceptions.total || 0, open: exceptions.open || 0 },
      sms_sent: smsCount.count || 0,
      recent_produce: recentProduce,
    },
  });
});

// ============================================================
// GET /api/admin/farmers
// ============================================================
router.get('/farmers', authenticateAdmin, (req: Request, res: Response) => {
  const { search, status, county } = req.query;

  let query = `
    SELECT f.*,
           COUNT(DISTINCT fp.id) as produce_count,
           COUNT(DISTINCT cr.id) as collection_count,
           COUNT(DISTINCT pay.id) as payment_count
    FROM farmers f
    LEFT JOIN farmer_produce fp ON f.id = fp.farmer_id
    LEFT JOIN collection_requests cr ON f.id = cr.farmer_id
    LEFT JOIN payments pay ON f.id = pay.farmer_id
    WHERE 1=1
  `;
  const params: any[] = [];

  if (search) {
    query += ' AND (f.full_name LIKE ? OR f.phone LIKE ? OR f.farmer_id LIKE ?)';
    const s = `%${search}%`;
    params.push(s, s, s);
  }
  if (status) { query += ' AND f.status = ?'; params.push(status); }
  if (county) { query += ' AND f.county LIKE ?'; params.push(`%${county}%`); }

  query += ' GROUP BY f.id ORDER BY f.created_at DESC';

  const farmers = db.prepare(query).all(...params);
  res.json({ success: true, data: farmers });
});

// ============================================================
// GET /api/admin/exceptions
// ============================================================
router.get('/exceptions', authenticateAdmin, (_req: Request, res: Response) => {
  const exceptions = db.prepare('SELECT * FROM exceptions ORDER BY created_at DESC').all();
  res.json({ success: true, data: exceptions });
});

// ============================================================
// POST /api/admin/exceptions
// ============================================================
router.post('/exceptions', authenticateAdmin, (req: AuthenticatedRequest, res: Response) => {
  const { type, severity, related_entity, related_entity_id, description } = req.body;

  if (!type || !related_entity || !related_entity_id || !description) {
    res.status(400).json({ success: false, error: 'Required: type, related_entity, related_entity_id, description' });
    return;
  }

  const exception_id = generateExceptionId();
  const result = db.prepare(`
    INSERT INTO exceptions (exception_id, type, severity, related_entity, related_entity_id, description, status)
    VALUES (?, ?, ?, ?, ?, ?, 'OPEN')
  `).run(exception_id, type, severity || 'MEDIUM', related_entity, related_entity_id, description);

  auditLog('ADMIN', String(req.user!.id), 'EXCEPTION_CREATED', 'exceptions', String(result.lastInsertRowid));

  res.status(201).json({ success: true, data: db.prepare('SELECT * FROM exceptions WHERE id = ?').get(result.lastInsertRowid) });
});

// ============================================================
// PUT /api/admin/exceptions/:id
// ============================================================
router.put('/exceptions/:id', authenticateAdmin, (req: AuthenticatedRequest, res: Response) => {
  const id = parseInt(req.params.id);
  const { status, assigned_person } = req.body;

  const exception = db.prepare('SELECT * FROM exceptions WHERE id = ?').get(id) as any;
  if (!exception) {
    res.status(404).json({ success: false, error: 'Exception not found' });
    return;
  }

  const fields: string[] = [];
  const values: any[] = [];

  if (status) {
    fields.push('status = ?');
    values.push(status);
    if (status === 'RESOLVED' || status === 'CLOSED') {
      fields.push("resolved_at = datetime('now')");
    }
  }
  if (assigned_person) { fields.push('assigned_person = ?'); values.push(assigned_person); }
  values.push(id);

  db.prepare(`UPDATE exceptions SET ${fields.join(', ')} WHERE id = ?`).run(...values);
  auditLog('ADMIN', String(req.user!.id), 'EXCEPTION_UPDATED', 'exceptions', String(id), { status });

  res.json({ success: true, data: db.prepare('SELECT * FROM exceptions WHERE id = ?').get(id) });
});

// ============================================================
// GET /api/admin/logistics  — F.T.M.A simulator data
// ============================================================
router.get('/logistics', authenticateAdmin, (_req: Request, res: Response) => {
  const collections = db.prepare(`
    SELECT cr.*,
           f.full_name as farmer_name, f.phone as farmer_phone, f.location as farmer_location,
           fp.quantity as produce_quantity, p.name as product_name
    FROM collection_requests cr
    JOIN farmers f ON cr.farmer_id = f.id
    JOIN farmer_produce fp ON cr.produce_submission_id = fp.id
    JOIN products p ON fp.product_id = p.id
    ORDER BY cr.created_at DESC
  `).all();

  const stats = db.prepare(`
    SELECT
      SUM(CASE WHEN status = 'REQUESTED' THEN 1 ELSE 0 END) as requested,
      SUM(CASE WHEN status = 'ACCEPTED' THEN 1 ELSE 0 END) as accepted,
      SUM(CASE WHEN status = 'VEHICLE_ASSIGNED' THEN 1 ELSE 0 END) as vehicle_assigned,
      SUM(CASE WHEN status = 'COMPLETED' THEN 1 ELSE 0 END) as completed
    FROM collection_requests
  `).get() as any;

  res.json({ success: true, data: { collections, stats } });
});

// ============================================================
// POST /api/admin/logistics/ftma-accept/:collectionId
// ============================================================
router.post('/logistics/ftma-accept/:collectionId', authenticateAdmin, (req: AuthenticatedRequest, res: Response) => {
  const { collectionId } = req.params;

  const collection = db.prepare('SELECT * FROM collection_requests WHERE collection_id = ?').get(collectionId) as any;
  if (!collection) {
    res.status(404).json({ success: false, error: 'Collection not found' });
    return;
  }

  // Simulate F.T.M.A vehicle assignment
  const vehicleNum = Math.floor(Math.random() * 10) + 1;
  const vehicle_id = `FTMA-TRUCK-${String(vehicleNum).padStart(3, '0')}`;
  const driver_id = `FTMA-DRV-${String(Math.floor(Math.random() * 20) + 1).padStart(3, '0')}`;

  db.prepare(`
    UPDATE collection_requests
    SET status = 'VEHICLE_ASSIGNED', vehicle_id = ?, driver_id = ?, updated_at = datetime('now')
    WHERE collection_id = ?
  `).run(vehicle_id, driver_id, collectionId);

  // Update produce status
  db.prepare("UPDATE farmer_produce SET status = 'COLLECTION_SCHEDULED', updated_at = datetime('now') WHERE id = ?")
    .run(collection.produce_submission_id);

  // Notify farmer
  const farmer = db.prepare('SELECT * FROM farmers WHERE id = ?').get(collection.farmer_id) as any;
  if (farmer) {
    const { notifyCollectionScheduled } = require('../services/notification.service');
    notifyCollectionScheduled(collection.farmer_id, farmer.phone, collection.scheduled_date, collection.pickup_location);
  }

  auditLog('SYSTEM', 'FTMA', 'COLLECTION_ACCEPTED', 'collection_requests', String(collection.id), { vehicle_id, driver_id });

  res.json({
    success: true,
    message: 'F.T.M.A accepted collection and assigned vehicle',
    data: db.prepare('SELECT * FROM collection_requests WHERE collection_id = ?').get(collectionId),
  });
});

// ============================================================
// GET /api/admin/audit-logs
// ============================================================
router.get('/audit-logs', authenticateAdmin, (_req: Request, res: Response) => {
  const logs = db.prepare('SELECT * FROM audit_logs ORDER BY timestamp DESC LIMIT 200').all();
  res.json({ success: true, data: logs });
});

// ============================================================
// POST /api/admin/support-requests
// ============================================================
router.get('/support-requests', authenticateAdmin, (_req: Request, res: Response) => {
  const requests = db.prepare(`
    SELECT sr.*, f.full_name, f.phone FROM support_requests sr
    JOIN farmers f ON sr.farmer_id = f.id
    ORDER BY sr.created_at DESC
  `).all();
  res.json({ success: true, data: requests });
});

// ============================================================
// GET /api/admin/products  — Product catalog
// ============================================================
router.get('/products', authenticateAdmin, (_req: Request, res: Response) => {
  const products = db.prepare('SELECT * FROM products ORDER BY name').all();
  res.json({ success: true, data: products });
});

export default router;
