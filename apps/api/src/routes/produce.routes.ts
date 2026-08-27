import { Router, Request, Response } from 'express';
import { db } from '../db/database';
import { generateSubmissionId, auditLog, getKgPerSack } from '../db/helpers';
import { authenticateFarmer, AuthenticatedRequest } from '../middleware/auth';
import { notifyProduceSubmitted } from '../services/notification.service';

const router = Router();

// ============================================================
// POST /api/produce  — Submit produce (authenticated farmer)
// ============================================================
router.post('/', authenticateFarmer, (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;
  const {
    product_id, quantity, unit = 'sack',
    availability_date, quality_estimate = 'GOOD',
    location, latitude, longitude, notes,
    source_channel = 'WEB',
  } = req.body;

  if (!product_id || !quantity || !availability_date || !location) {
    res.status(400).json({ success: false, error: 'Required: product_id, quantity, availability_date, location' });
    return;
  }

  if (quantity <= 0) {
    res.status(400).json({ success: false, error: 'Quantity must be greater than 0' });
    return;
  }

  // Validate product exists
  const product = db.prepare('SELECT * FROM products WHERE id = ? AND active = 1').get(Number(product_id)) as any;
  if (!product) {
    res.status(400).json({ success: false, error: 'Invalid product. Product not found or not active.' });
    return;
  }

  // Get farmer
  const farmer = db.prepare('SELECT * FROM farmers WHERE id = ?').get(user.id) as any;
  if (!farmer) {
    res.status(404).json({ success: false, error: 'Farmer not found' });
    return;
  }

  const estimated_kg = quantity * getKgPerSack(product_id);
  const submission_id = generateSubmissionId();
  const resolvedLocation = location || farmer.location;

  try {
    const stmt = db.prepare(`
      INSERT INTO farmer_produce (
        submission_id, farmer_id, product_id, quantity, unit,
        estimated_kg, availability_date, quality_estimate,
        location, latitude, longitude, source_channel, status, notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'SUBMITTED', ?)
    `);

    const result = stmt.run(
      submission_id, user.id, product_id, quantity, unit,
      estimated_kg, availability_date, quality_estimate,
      resolvedLocation, latitude || null, longitude || null,
      source_channel, notes || null
    );

    const newId = Number(result.lastInsertRowid);
    auditLog('FARMER', String(user.id), 'PRODUCE_SUBMITTED', 'farmer_produce', String(newId), {
      submission_id, product: product.name, quantity, source_channel
    });

    // Create notification
    notifyProduceSubmitted(user.id, farmer.phone, product.name, submission_id);

    // Return full produce record with product name
    const record = db.prepare(`
      SELECT fp.*, p.name as product_name, p.category, p.default_unit
      FROM farmer_produce fp
      JOIN products p ON fp.product_id = p.id
      WHERE fp.id = ?
    `).get(newId);

    res.status(201).json({
      success: true,
      message: `✅ Produce submitted successfully. Collection status: Pending.`,
      data: record,
    });
  } catch (err: any) {
    console.error('Produce submit error:', err);
    res.status(500).json({ success: false, error: 'Failed to submit produce. Please try again.' });
  }
});

// ============================================================
// GET /api/farmers/:id/produce  — Farmer's own produce
// ============================================================
router.get('/farmer/:farmerId', authenticateFarmer, (req: AuthenticatedRequest, res: Response) => {
  const requestedFarmerId = parseInt(req.params.farmerId);
  const user = req.user!;

  if (user.role !== 'ADMIN' && user.id !== requestedFarmerId) {
    res.status(403).json({ success: false, error: 'Access denied' });
    return;
  }

  const produce = db.prepare(`
    SELECT fp.*, p.name as product_name, p.category, p.default_unit
    FROM farmer_produce fp
    JOIN products p ON fp.product_id = p.id
    WHERE fp.farmer_id = ?
    ORDER BY fp.created_at DESC
  `).all(requestedFarmerId);

  res.json({ success: true, data: produce });
});

// ============================================================
// GET /api/produce/:id  — Single produce record
// ============================================================
router.get('/:id', authenticateFarmer, (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;
  const produce = db.prepare(`
    SELECT fp.*, p.name as product_name, p.category
    FROM farmer_produce fp
    JOIN products p ON fp.product_id = p.id
    WHERE fp.id = ?
  `).get(parseInt(req.params.id)) as any;

  if (!produce) {
    res.status(404).json({ success: false, error: 'Produce record not found' });
    return;
  }

  if (user.role !== 'ADMIN' && produce.farmer_id !== user.id) {
    res.status(403).json({ success: false, error: 'Access denied' });
    return;
  }

  res.json({ success: true, data: produce });
});

// ============================================================
// PUT /api/produce/:id  — Update produce status
// ============================================================
router.put('/:id', authenticateFarmer, (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;
  const id = parseInt(req.params.id);

  const produce = db.prepare('SELECT * FROM farmer_produce WHERE id = ?').get(id) as any;
  if (!produce) {
    res.status(404).json({ success: false, error: 'Produce not found' });
    return;
  }

  if (user.role !== 'ADMIN' && produce.farmer_id !== user.id) {
    res.status(403).json({ success: false, error: 'Access denied' });
    return;
  }

  const { status, notes } = req.body;
  const fields: string[] = ["updated_at = datetime('now')"];
  const values: any[] = [];

  if (status) { fields.push('status = ?'); values.push(status); }
  if (notes) { fields.push('notes = ?'); values.push(notes); }
  values.push(id);

  db.prepare(`UPDATE farmer_produce SET ${fields.join(', ')} WHERE id = ?`).run(...values);
  auditLog('FARMER', String(user.id), 'PRODUCE_UPDATED', 'farmer_produce', String(id), { status });

  const updated = db.prepare(`
    SELECT fp.*, p.name as product_name FROM farmer_produce fp
    JOIN products p ON fp.product_id = p.id WHERE fp.id = ?
  `).get(id);

  res.json({ success: true, data: updated });
});

// ============================================================
// GET /api/produce (admin — all produce with filters)
// ============================================================
router.get('/', authenticateFarmer, (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;
  if (user.role !== 'ADMIN') {
    res.status(403).json({ success: false, error: 'Admin access required' });
    return;
  }

  const { product_id, location, status, source_channel, date_from, date_to } = req.query;

  let query = `
    SELECT fp.*, p.name as product_name, p.category,
           f.full_name as farmer_name, f.phone as farmer_phone, f.county, f.sub_county
    FROM farmer_produce fp
    JOIN products p ON fp.product_id = p.id
    JOIN farmers f ON fp.farmer_id = f.id
    WHERE 1=1
  `;
  const params: any[] = [];

  if (product_id) { query += ' AND fp.product_id = ?'; params.push(product_id); }
  if (location) { query += ' AND fp.location LIKE ?'; params.push(`%${location}%`); }
  if (status) { query += ' AND fp.status = ?'; params.push(status); }
  if (source_channel) { query += ' AND fp.source_channel = ?'; params.push(source_channel); }
  if (date_from) { query += ' AND fp.availability_date >= ?'; params.push(date_from); }
  if (date_to) { query += ' AND fp.availability_date <= ?'; params.push(date_to); }

  query += ' ORDER BY fp.created_at DESC';
  const produce = db.prepare(query).all(...params);

  res.json({ success: true, data: produce });
});

export default router;
