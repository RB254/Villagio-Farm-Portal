import { Router, Request, Response } from 'express';
import { db } from '../db/database';
import { generateCollectionId, auditLog } from '../db/helpers';
import { authenticateFarmer, authenticateAdmin, AuthenticatedRequest } from '../middleware/auth';
import { notifyCollectionRequested, notifyCollectionScheduled, notifyProduceCollected } from '../services/notification.service';

const router = Router();

// ============================================================
// POST /api/collections  — Create collection request
// ============================================================
router.post('/', authenticateAdmin, (req: AuthenticatedRequest, res: Response) => {
  const {
    farmer_id, produce_submission_id, quantity,
    pickup_location, scheduled_date, time_window = '08:00-12:00',
    logistics_partner = 'FTMA',
  } = req.body;

  if (!farmer_id || !produce_submission_id || !quantity || !pickup_location || !scheduled_date) {
    res.status(400).json({ success: false, error: 'Required: farmer_id, produce_submission_id, quantity, pickup_location, scheduled_date' });
    return;
  }

  const produce = db.prepare('SELECT * FROM farmer_produce WHERE id = ?').get(produce_submission_id) as any;
  if (!produce) {
    res.status(404).json({ success: false, error: 'Produce submission not found' });
    return;
  }

  const farmer = db.prepare('SELECT * FROM farmers WHERE id = ?').get(farmer_id) as any;
  if (!farmer) {
    res.status(404).json({ success: false, error: 'Farmer not found' });
    return;
  }

  const collection_id = generateCollectionId();

  try {
    const stmt = db.prepare(`
      INSERT INTO collection_requests (
        collection_id, farmer_id, produce_submission_id, quantity,
        pickup_location, scheduled_date, time_window, logistics_partner, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'REQUESTED')
    `);
    const result = stmt.run(collection_id, farmer_id, produce_submission_id, quantity, pickup_location, scheduled_date, time_window, logistics_partner);

    const newId = Number(result.lastInsertRowid);

    // Update produce status
    db.prepare("UPDATE farmer_produce SET status = 'COLLECTION_REQUESTED', updated_at = datetime('now') WHERE id = ?").run(produce_submission_id);

    auditLog('SYSTEM', 'SYSTEM', 'COLLECTION_CREATED', 'collection_requests', String(newId), { collection_id });

    // Get product name for notification
    const product = db.prepare('SELECT name FROM products WHERE id = ?').get(produce.product_id) as any;
    notifyCollectionRequested(farmer_id, farmer.phone, product?.name || 'produce', collection_id);

    const record = db.prepare(`
      SELECT cr.*, f.full_name as farmer_name, f.phone as farmer_phone,
             fp.quantity as produce_quantity, p.name as product_name
      FROM collection_requests cr
      JOIN farmers f ON cr.farmer_id = f.id
      JOIN farmer_produce fp ON cr.produce_submission_id = fp.id
      JOIN products p ON fp.product_id = p.id
      WHERE cr.id = ?
    `).get(newId);

    res.status(201).json({ success: true, data: record });
  } catch (err: any) {
    console.error('Collection create error:', err);
    res.status(500).json({ success: false, error: 'Failed to create collection request' });
  }
});

// ============================================================
// GET /api/collections  — All collections (admin)
// ============================================================
router.get('/', authenticateFarmer, (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;
  
  let query = `
    SELECT cr.*, f.full_name as farmer_name, f.phone as farmer_phone, f.location as farmer_location,
           fp.quantity as produce_quantity, p.name as product_name, fp.source_channel
    FROM collection_requests cr
    JOIN farmers f ON cr.farmer_id = f.id
    JOIN farmer_produce fp ON cr.produce_submission_id = fp.id
    JOIN products p ON fp.product_id = p.id
  `;
  const params: any[] = [];

  if (user.role !== 'ADMIN') {
    query += ' WHERE cr.farmer_id = ?';
    params.push(user.id);
  }

  query += ' ORDER BY cr.created_at DESC';

  const collections = db.prepare(query).all(...params);
  res.json({ success: true, data: collections });
});

// ============================================================
// GET /api/collections/:id
// ============================================================
router.get('/:id', authenticateFarmer, (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;
  const collection = db.prepare(`
    SELECT cr.*, f.full_name as farmer_name, f.phone as farmer_phone,
           fp.quantity as produce_quantity, fp.location as produce_location,
           p.name as product_name
    FROM collection_requests cr
    JOIN farmers f ON cr.farmer_id = f.id
    JOIN farmer_produce fp ON cr.produce_submission_id = fp.id
    JOIN products p ON fp.product_id = p.id
    WHERE cr.id = ?
  `).get(parseInt(req.params.id)) as any;

  if (!collection) {
    res.status(404).json({ success: false, error: 'Collection not found' });
    return;
  }

  if (user.role !== 'ADMIN' && collection.farmer_id !== user.id) {
    res.status(403).json({ success: false, error: 'Access denied' });
    return;
  }

  res.json({ success: true, data: collection });
});

// ============================================================
// PUT /api/collections/:id  — Update collection status
// ============================================================
router.put('/:id', authenticateAdmin, (req: AuthenticatedRequest, res: Response) => {
  const id = parseInt(req.params.id);
  const { status, vehicle_id, driver_id, scheduled_date, time_window } = req.body;

  const collection = db.prepare('SELECT * FROM collection_requests WHERE id = ?').get(id) as any;
  if (!collection) {
    res.status(404).json({ success: false, error: 'Collection not found' });
    return;
  }

  const fields: string[] = ["updated_at = datetime('now')"];
  const values: any[] = [];

  if (status) { fields.push('status = ?'); values.push(status); }
  if (vehicle_id) { fields.push('vehicle_id = ?'); values.push(vehicle_id); }
  if (driver_id) { fields.push('driver_id = ?'); values.push(driver_id); }
  if (scheduled_date) { fields.push('scheduled_date = ?'); values.push(scheduled_date); }
  if (time_window) { fields.push('time_window = ?'); values.push(time_window); }
  values.push(id);

  db.prepare(`UPDATE collection_requests SET ${fields.join(', ')} WHERE id = ?`).run(...values);
  auditLog('ADMIN', String(req.user!.id), 'COLLECTION_UPDATED', 'collection_requests', String(id), { status });

  // Update produce status when collection status changes
  if (status) {
    const produceStatusMap: Record<string, string> = {
      ACCEPTED: 'COLLECTION_REQUESTED',
      VEHICLE_ASSIGNED: 'COLLECTION_SCHEDULED',
      ROUTE_PLANNED: 'COLLECTION_SCHEDULED',
      IN_PROGRESS: 'COLLECTION_SCHEDULED',
      COMPLETED: 'COLLECTED',
    };
    if (produceStatusMap[status]) {
      db.prepare("UPDATE farmer_produce SET status = ?, updated_at = datetime('now') WHERE id = ?")
        .run(produceStatusMap[status], collection.produce_submission_id);
    }

    // Notify farmer on key status changes
    const farmer = db.prepare('SELECT * FROM farmers WHERE id = ?').get(collection.farmer_id) as any;
    if (farmer) {
      if (status === 'VEHICLE_ASSIGNED' || status === 'ROUTE_PLANNED') {
        notifyCollectionScheduled(collection.farmer_id, farmer.phone, collection.scheduled_date, collection.pickup_location);
      }
      if (status === 'COMPLETED') {
        const product = db.prepare(`
          SELECT p.name FROM farmer_produce fp JOIN products p ON fp.product_id = p.id WHERE fp.id = ?
        `).get(collection.produce_submission_id) as any;
        notifyProduceCollected(collection.farmer_id, farmer.phone, product?.name || 'produce');
      }
    }
  }

  const updated = db.prepare('SELECT * FROM collection_requests WHERE id = ?').get(id);
  res.json({ success: true, data: updated });
});

export default router;
