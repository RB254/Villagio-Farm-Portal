import { Router, Request, Response } from 'express';
import { db } from '../db/database';
import { authenticateAdmin, AuthenticatedRequest } from '../middleware/auth';
import { generateCollectionId, auditLog } from '../db/helpers';
import { notifyCollectionRequested } from '../services/notification.service';

const router = Router();

// ============================================================
// GET /api/sourcing/summary  — Aggregate available supply
// ============================================================
router.get('/summary', authenticateAdmin, (_req: Request, res: Response) => {
  // Total available supply (SUBMITTED or AVAILABLE status)
  const totalQuery = db.prepare(`
    SELECT COUNT(DISTINCT fp.farmer_id) as farmer_count,
           SUM(fp.quantity) as total_sacks,
           SUM(fp.estimated_kg) as total_kg
    FROM farmer_produce fp
    WHERE fp.status IN ('SUBMITTED', 'AVAILABLE')
  `).get() as any;

  // By product
  const byProduct = db.prepare(`
    SELECT p.id as product_id, p.name as product_name,
           SUM(fp.quantity) as total_sacks,
           COUNT(DISTINCT fp.farmer_id) as farmer_count,
           AVG(fp.quantity) as avg_quantity_per_farmer
    FROM farmer_produce fp
    JOIN products p ON fp.product_id = p.id
    WHERE fp.status IN ('SUBMITTED', 'AVAILABLE')
    GROUP BY p.id, p.name
    ORDER BY total_sacks DESC
  `).all();

  // By location
  const byLocation = db.prepare(`
    SELECT fp.location, SUM(fp.quantity) as total_sacks, COUNT(*) as submission_count
    FROM farmer_produce fp
    WHERE fp.status IN ('SUBMITTED', 'AVAILABLE')
    GROUP BY fp.location
    ORDER BY total_sacks DESC
  `).all();

  // By availability date
  const byDate = db.prepare(`
    SELECT fp.availability_date, SUM(fp.quantity) as total_sacks, COUNT(*) as submission_count
    FROM farmer_produce fp
    WHERE fp.status IN ('SUBMITTED', 'AVAILABLE')
    GROUP BY fp.availability_date
    ORDER BY fp.availability_date ASC
  `).all();

  // By source channel
  const byChannel = db.prepare(`
    SELECT source_channel, COUNT(*) as count, SUM(quantity) as total_sacks
    FROM farmer_produce
    WHERE status IN ('SUBMITTED', 'AVAILABLE')
    GROUP BY source_channel
  `).all();

  // Expected incoming (all active submissions including scheduled)
  const expectedIncoming = db.prepare(`
    SELECT p.name as product_name, SUM(fp.quantity) as total_sacks
    FROM farmer_produce fp JOIN products p ON fp.product_id = p.id
    WHERE fp.status NOT IN ('COMPLETED', 'SOLD')
    GROUP BY p.id
  `).all();

  res.json({
    success: true,
    data: {
      total: totalQuery,
      by_product: byProduct,
      by_location: byLocation,
      by_date: byDate,
      by_channel: byChannel,
      expected_incoming: expectedIncoming,
    },
  });
});

// ============================================================
// POST /api/sourcing/generate-collection
// ============================================================
router.post('/generate-collection', authenticateAdmin, (req: AuthenticatedRequest, res: Response) => {
  const { product_id, location_filter } = req.body;

  // Find all available produce matching criteria
  let query = `
    SELECT fp.*, f.full_name, f.phone, f.location as farmer_location, p.name as product_name
    FROM farmer_produce fp
    JOIN farmers f ON fp.farmer_id = f.id
    JOIN products p ON fp.product_id = p.id
    WHERE fp.status IN ('SUBMITTED', 'AVAILABLE')
  `;
  const params: any[] = [];

  if (product_id) { query += ' AND fp.product_id = ?'; params.push(product_id); }
  if (location_filter) { query += ' AND (fp.location LIKE ? OR f.location LIKE ?)'; params.push(`%${location_filter}%`, `%${location_filter}%`); }

  query += ' ORDER BY fp.availability_date ASC, fp.created_at ASC';

  const availableProduce = db.prepare(query).all(...params) as any[];

  if (!availableProduce.length) {
    res.status(400).json({ success: false, error: 'No available produce found matching criteria' });
    return;
  }

  // Schedule collection for tomorrow
  const scheduledDate = new Date();
  scheduledDate.setDate(scheduledDate.getDate() + 1);
  const scheduledDateStr = scheduledDate.toISOString().split('T')[0];

  const collections = [];
  for (const produce of availableProduce) {
    const collection_id = generateCollectionId();
    const result = db.prepare(`
      INSERT INTO collection_requests (
        collection_id, farmer_id, produce_submission_id, quantity,
        pickup_location, scheduled_date, time_window, logistics_partner, status
      ) VALUES (?, ?, ?, ?, ?, ?, '08:00-12:00', 'FTMA', 'REQUESTED')
    `).run(
      collection_id, produce.farmer_id, produce.id,
      produce.quantity, produce.location || produce.farmer_location, scheduledDateStr
    );

    // Update produce status
    db.prepare("UPDATE farmer_produce SET status = 'COLLECTION_REQUESTED', updated_at = datetime('now') WHERE id = ?").run(produce.id);

    // Notify farmer
    notifyCollectionRequested(produce.farmer_id, produce.phone, produce.product_name, collection_id);

    auditLog('SYSTEM', 'SOURCING_ENGINE', 'COLLECTION_CREATED', 'collection_requests', String(result.lastInsertRowid), {
      collection_id, product: produce.product_name, quantity: produce.quantity
    });

    collections.push({ collection_id, farmer: produce.full_name, product: produce.product_name, quantity: produce.quantity });
  }

  res.status(201).json({
    success: true,
    message: `${collections.length} collection request(s) generated`,
    data: collections,
  });
});

// ============================================================
// GET /api/demand/summary
// ============================================================
router.get('/demand', authenticateAdmin, (_req: Request, res: Response) => {
  const supply = db.prepare(`
    SELECT fp.product_id, p.name as product_name, SUM(fp.quantity) as supply_sacks
    FROM farmer_produce fp JOIN products p ON fp.product_id = p.id
    WHERE fp.status IN ('SUBMITTED', 'AVAILABLE')
    GROUP BY fp.product_id
  `).all() as any[];

  const demand = db.prepare(`
    SELECT dd.product_id, p.name as product_name, SUM(dd.quantity_sacks) as demand_sacks
    FROM demand_data dd JOIN products p ON dd.product_id = p.id
    WHERE dd.demand_date >= date('now')
    GROUP BY dd.product_id
  `).all() as any[];

  // Merge supply and demand
  const allProductIds = new Set([
    ...supply.map((s) => s.product_id),
    ...demand.map((d) => d.product_id),
  ]);

  const summary = Array.from(allProductIds).map((pid) => {
    const s = supply.find((x) => x.product_id === pid);
    const d = demand.find((x) => x.product_id === pid);
    const supplySacks = s?.supply_sacks || 0;
    const demandSacks = d?.demand_sacks || 0;
    return {
      product_id: pid,
      product_name: s?.product_name || d?.product_name || 'Unknown',
      supply_sacks: supplySacks,
      demand_sacks: demandSacks,
      surplus_or_shortage: supplySacks - demandSacks,
      status: supplySacks >= demandSacks ? 'SUFFICIENT' : 'SHORTAGE',
    };
  });

  res.json({ success: true, data: summary });
});

export default router;
