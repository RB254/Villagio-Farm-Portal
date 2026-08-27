import { db } from '../db/database';
import { generateCollectionId, generateExceptionId, auditLog } from '../db/helpers';
import { notifyCollectionRequested, createNotification } from './notification.service';

// ============================================================
// AUTOMATION ENGINE — Rule-based deterministic automation
// Runs on startup and periodically
//
// Rules:
// 1. IF produce availability_date is today or past AND status=SUBMITTED
//    → move to AVAILABLE
// 2. IF demand exists AND supply >= demand threshold
//    → recommend collection (create exception for human review)
// 3. IF collection is VEHICLE_ASSIGNED AND scheduled_date is today
//    → send reminder notification
// ============================================================

export function runAutomationCycle(): void {
  console.log('⚙️  Running automation cycle...');

  // Rule 1: Move past-availability produce to AVAILABLE
  db.prepare(`
    UPDATE farmer_produce
    SET status = 'AVAILABLE', updated_at = datetime('now')
    WHERE status = 'SUBMITTED'
    AND date(availability_date) <= date('now')
  `).run();

  // Rule 2: Check if collection should be recommended
  // For each product: if supply > 5 sacks and availability today or tomorrow
  const productsWithSupply = db.prepare(`
    SELECT fp.product_id, p.name as product_name,
           SUM(fp.quantity) as total_sacks,
           COUNT(DISTINCT fp.farmer_id) as farmer_count
    FROM farmer_produce fp
    JOIN products p ON fp.product_id = p.id
    WHERE fp.status IN ('SUBMITTED', 'AVAILABLE')
    AND date(fp.availability_date) <= date('now', '+2 days')
    GROUP BY fp.product_id
    HAVING total_sacks >= 5
  `).all() as any[];

  for (const product of productsWithSupply) {
    // Check if we already have a collection for this product today
    const existingCollection = db.prepare(`
      SELECT COUNT(*) as count FROM collection_requests cr
      JOIN farmer_produce fp ON cr.produce_submission_id = fp.id
      WHERE fp.product_id = ? AND date(cr.created_at) = date('now')
      AND cr.status NOT IN ('CANCELLED')
    `).get(product.product_id) as any;

    if (existingCollection.count === 0) {
      // Check demand
      const demandData = db.prepare(`
        SELECT SUM(quantity_sacks) as demand FROM demand_data
        WHERE product_id = ? AND date(demand_date) >= date('now')
      `).get(product.product_id) as any;

      const demand = demandData?.demand || 0;
      if (demand > 0 && product.total_sacks >= demand * 0.5) {
        // Create exception for human review (collection recommendation)
        const excId = generateExceptionId();
        const existing = db.prepare("SELECT id FROM exceptions WHERE type='SYSTEM_FAILURE' AND description LIKE ?").get(`%Collect%${product.product_name}%`);
        if (!existing) {
          db.prepare(`
            INSERT INTO exceptions (exception_id, type, severity, related_entity, related_entity_id, description, status)
            VALUES (?, 'SYSTEM_MESSAGE', 'LOW', 'product', ?, ?, 'OPEN')
          `).run(excId, String(product.product_id),
            `Collection recommended: ${product.total_sacks} sacks of ${product.product_name} available from ${product.farmer_count} farmer(s). Demand: ${demand} sacks.`
          );
          auditLog('SYSTEM', 'AUTOMATION', 'COLLECTION_RECOMMENDED', 'products', String(product.product_id), {
            product: product.product_name, supply: product.total_sacks, demand
          });
        }
      }
    }
  }

  // Rule 3: Collection reminder — scheduled for today
  const todayCollections = db.prepare(`
    SELECT cr.*, f.id as fid, f.phone, f.full_name
    FROM collection_requests cr
    JOIN farmers f ON cr.farmer_id = f.id
    WHERE cr.status IN ('VEHICLE_ASSIGNED', 'ROUTE_PLANNED')
    AND date(cr.scheduled_date) = date('now')
  `).all() as any[];

  for (const collection of todayCollections) {
    // Only send reminder once (check if already sent today)
    const alreadySent = db.prepare(`
      SELECT id FROM notifications
      WHERE farmer_id = ? AND type = 'COLLECTION_REMINDER'
      AND date(created_at) = date('now')
    `).get(collection.fid);

    if (!alreadySent) {
      createNotification({
        farmer_id: collection.fid,
        type: 'COLLECTION_REMINDER',
        title: '🚚 Collection Today!',
        message: `Your collection is today. Vehicle: ${collection.vehicle_id}. Time: ${collection.time_window}.`,
        sendSMSToPhone: collection.phone,
      });
    }
  }

  console.log('✅ Automation cycle complete');
}

// Start automation on a 5-minute interval
export function startAutomationEngine(): void {
  runAutomationCycle();
  setInterval(runAutomationCycle, 5 * 60 * 1000);
}
