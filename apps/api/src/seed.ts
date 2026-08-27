import dotenv from 'dotenv';
dotenv.config();

import { db, initializeDatabase } from './db/database';
import { hashPin } from './db/helpers';

// ============================================================
// SEED DATA — Demo dataset per specification
// ============================================================

function seed() {
  initializeDatabase();

  console.log('🌱 Seeding database...');

  // Clear existing data (for fresh seed)
  db.exec(`
    DELETE FROM sms_log;
    DELETE FROM support_requests;
    DELETE FROM demand_data;
    DELETE FROM exceptions;
    DELETE FROM audit_logs;
    DELETE FROM payments;
    DELETE FROM notifications;
    DELETE FROM collection_requests;
    DELETE FROM farmer_produce;
    DELETE FROM ussd_sessions;
    DELETE FROM ivr_sessions;
    DELETE FROM admins;
    DELETE FROM farmers;
    DELETE FROM products;
    DELETE FROM logistics_partners;
    DELETE FROM sqlite_sequence;
  `);

  // ─────── PRODUCTS ─────────────────────────────────────────
  const products = [
    { name: 'Potatoes', category: 'root', unit: 'sack', kg_per_unit: 110 },
    { name: 'Onions', category: 'vegetable', unit: 'sack', kg_per_unit: 90 },
    { name: 'Tomatoes', category: 'vegetable', unit: 'sack', kg_per_unit: 60 },
    { name: 'Beans', category: 'legume', unit: 'sack', kg_per_unit: 80 },
    { name: 'Maize', category: 'grain', unit: 'sack', kg_per_unit: 90 },
    { name: 'Other', category: 'other', unit: 'sack', kg_per_unit: 90 },
  ];

  const productIds: Record<string, number> = {};
  for (const p of products) {
    const res = db.prepare(`
      INSERT INTO products (name, category, default_unit, kg_per_unit, active) VALUES (?, ?, ?, ?, 1)
    `).run(p.name, p.category, p.unit, p.kg_per_unit);
    productIds[p.name] = res.lastInsertRowid as number;
  }
  console.log('✅ Products seeded:', Object.keys(productIds));

  // ─────── ADMIN ────────────────────────────────────────────
  db.prepare(`
    INSERT INTO admins (username, pin_hash, role) VALUES (?, ?, 'ADMIN')
  `).run('admin', hashPin('1234'));
  console.log('✅ Admin seeded: username=admin, pin=1234');

  // ─────── LOGISTICS PARTNERS ───────────────────────────────
  db.prepare(`
    INSERT INTO logistics_partners (code, name, contact_phone, active) VALUES (?, ?, ?, 1)
  `).run('FTMA', 'Farm To Market Alliance Logistics', '+254700000001');
  console.log('✅ Logistics partner FTMA seeded');

  // ─────── FARMERS (A, B, C, D) ─────────────────────────────
  const farmersData = [
    {
      farmer_id: 'VLG-FMR-000001',
      full_name: 'Alice Wanjiku',
      phone: '+254711000001',
      pin: '1111',
      county: 'Kiambu',
      sub_county: 'Limuru',
      location: 'Limuru, Kiambu',
      latitude: -1.1167,
      longitude: 36.6333,
    },
    {
      farmer_id: 'VLG-FMR-000002',
      full_name: 'Bernard Mwangi',
      phone: '+254711000002',
      pin: '2222',
      county: 'Kiambu',
      sub_county: 'Kiambu Town',
      location: 'Kiambu, Kiambu',
      latitude: -1.1733,
      longitude: 36.8267,
    },
    {
      farmer_id: 'VLG-FMR-000003',
      full_name: 'Caroline Achieng',
      phone: '+254711000003',
      pin: '3333',
      county: 'Kiambu',
      sub_county: 'Ruiru',
      location: 'Ruiru, Kiambu',
      latitude: -1.1452,
      longitude: 36.9604,
    },
    {
      farmer_id: 'VLG-FMR-000004',
      full_name: 'David Kamau',
      phone: '+254711000004',
      pin: '4444',
      county: 'Murang\'a',
      sub_county: 'Kigumo',
      location: 'Kigumo, Murang\'a',
      latitude: -0.7378,
      longitude: 36.9738,
    },
  ];

  const farmerIds: number[] = [];
  for (const f of farmersData) {
    const res = db.prepare(`
      INSERT INTO farmers (farmer_id, full_name, phone, pin_hash, county, sub_county, location, latitude, longitude, preferred_language, preferred_channel, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'en', 'WEB', 'ACTIVE')
    `).run(f.farmer_id, f.full_name, f.phone, hashPin(f.pin), f.county, f.sub_county, f.location, f.latitude, f.longitude);
    farmerIds.push(res.lastInsertRowid as number);
  }
  console.log('✅ Farmers seeded: A (Alice), B (Bernard), C (Caroline), D (David)');

  // ─────── PRODUCE SUBMISSIONS ──────────────────────────────
  // Farmer A: 5 sacks potatoes — WEB
  // Farmer B: 10 sacks potatoes — USSD
  // Farmer C: 3 sacks potatoes — IVR
  // Farmer D: 8 sacks potatoes — WEB
  // Total: 26 sacks potatoes

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = tomorrow.toISOString().split('T')[0];

  const produceData = [
    { farmer_idx: 0, product: 'Potatoes', qty: 5, channel: 'WEB', sub_id: 'VLG-PRD-000001', status: 'SUBMITTED' },
    { farmer_idx: 1, product: 'Potatoes', qty: 10, channel: 'USSD', sub_id: 'VLG-PRD-000002', status: 'SUBMITTED' },
    { farmer_idx: 2, product: 'Potatoes', qty: 3, channel: 'IVR', sub_id: 'VLG-PRD-000003', status: 'SUBMITTED' },
    { farmer_idx: 3, product: 'Potatoes', qty: 8, channel: 'WEB', sub_id: 'VLG-PRD-000004', status: 'SUBMITTED' },
    // Extra demo produce
    { farmer_idx: 0, product: 'Tomatoes', qty: 4, channel: 'WEB', sub_id: 'VLG-PRD-000005', status: 'SUBMITTED' },
    { farmer_idx: 1, product: 'Onions', qty: 6, channel: 'USSD', sub_id: 'VLG-PRD-000006', status: 'AVAILABLE' },
  ];

  const produceIds: number[] = [];
  for (const p of produceData) {
    const pid = productIds[p.product];
    const fid = farmerIds[p.farmer_idx];
    const kg = p.qty * (products.find(x => x.name === p.product)?.kg_per_unit || 90);
    const loc = farmersData[p.farmer_idx].location;
    const res = db.prepare(`
      INSERT INTO farmer_produce (submission_id, farmer_id, product_id, quantity, unit, estimated_kg, availability_date, quality_estimate, location, source_channel, status)
      VALUES (?, ?, ?, ?, 'sack', ?, ?, 'GOOD', ?, ?, ?)
    `).run(p.sub_id, fid, pid, p.qty, kg, tomorrowStr, loc, p.channel, p.status);
    produceIds.push(res.lastInsertRowid as number);
  }
  console.log('✅ Produce seeded: 26 sacks potatoes across 4 farmers (A=5 WEB, B=10 USSD, C=3 IVR, D=8 WEB)');

  // ─────── DEMAND DATA ──────────────────────────────────────
  const demandData = [
    { product: 'Potatoes', qty: 20, source: 'HOUSEHOLD', location: 'Nairobi' },
    { product: 'Potatoes', qty: 10, source: 'RESTAURANT', location: 'Nairobi' },
    { product: 'Onions', qty: 8, source: 'GROCERY_STORE', location: 'Nairobi' },
    { product: 'Tomatoes', qty: 5, source: 'HOTEL', location: 'Nairobi' },
    { product: 'Beans', qty: 3, source: 'WHOLESALER', location: 'Nairobi' },
  ];

  for (const d of demandData) {
    db.prepare(`
      INSERT INTO demand_data (product_id, quantity_sacks, demand_source, location, demand_date)
      VALUES (?, ?, ?, ?, date('now', '+7 days'))
    `).run(productIds[d.product], d.qty, d.source, d.location);
  }
  console.log('✅ Demand data seeded');

  // ─────── ONE COMPLETED COLLECTION CYCLE (for demo) ────────
  // Create a collection for Farmer D's potatoes — completed cycle
  const collectionRes = db.prepare(`
    INSERT INTO collection_requests (collection_id, farmer_id, produce_submission_id, quantity, pickup_location, scheduled_date, time_window, logistics_partner, vehicle_id, driver_id, status)
    VALUES ('COL-00001', ?, ?, 8, ?, date('now', '-1 days'), '08:00-12:00', 'FTMA', 'FTMA-TRUCK-003', 'FTMA-DRV-007', 'COMPLETED')
  `).run(farmerIds[3], produceIds[3], farmersData[3].location);

  // Update Farmer D's produce to COLLECTED
  db.prepare("UPDATE farmer_produce SET status = 'COLLECTED', updated_at = datetime('now') WHERE id = ?").run(produceIds[3]);

  // Payment for Farmer D
  db.prepare(`
    INSERT INTO payments (farmer_id, produce_submission_id, amount, currency, method, status, transaction_reference)
    VALUES (?, ?, 9600, 'KES', 'MPESA', 'COMPLETED', 'MPESA-1234567890-ABC')
  `).run(farmerIds[3], produceIds[3]);

  // Pending payment for Farmer A
  db.prepare(`
    INSERT INTO payments (farmer_id, produce_submission_id, amount, currency, method, status)
    VALUES (?, ?, 5500, 'KES', 'MPESA', 'PENDING')
  `).run(farmerIds[0], produceIds[0]);

  console.log('✅ Collection and payment records seeded');

  // ─────── NOTIFICATIONS ────────────────────────────────────
  for (let i = 0; i < farmerIds.length; i++) {
    db.prepare(`
      INSERT INTO notifications (farmer_id, type, title, message, channel, read)
      VALUES (?, 'PRODUCE_SUBMITTED', 'Produce Submitted ✅', 'Your produce has been registered successfully.', 'WEB', 0)
    `).run(farmerIds[i]);
  }

  // Additional notifications for completed farmer
  db.prepare(`
    INSERT INTO notifications (farmer_id, type, title, message, channel, read)
    VALUES (?, 'PRODUCE_COLLECTED', 'Produce Collected ✅', 'Your 8 sacks of Potatoes have been collected.', 'WEB', 0)
  `).run(farmerIds[3]);
  db.prepare(`
    INSERT INTO notifications (farmer_id, type, title, message, channel, read)
    VALUES (?, 'PAYMENT_PROCESSED', 'Payment Processed 💰', 'KES 9,600 has been sent to your M-Pesa.', 'WEB', 1)
  `).run(farmerIds[3]);

  console.log('✅ Notifications seeded');

  // ─────── EXCEPTIONS ───────────────────────────────────────
  db.prepare(`
    INSERT INTO exceptions (exception_id, type, severity, related_entity, related_entity_id, description, status)
    VALUES ('EXC-00001', 'SYSTEM_MESSAGE', 'LOW', 'product', '1', 'Collection recommended: 26 sacks of Potatoes available. Demand: 30 sacks.', 'OPEN')
  `).run();
  console.log('✅ Exception seeded');

  console.log('\n🎉 Seed complete!');
  console.log('\nDemo login credentials:');
  console.log('  Farmer A: phone=0711000001 pin=1111 (Alice Wanjiku)');
  console.log('  Farmer B: phone=0711000002 pin=2222 (Bernard Mwangi)');
  console.log('  Farmer C: phone=0711000003 pin=3333 (Caroline Achieng)');
  console.log('  Farmer D: phone=0711000004 pin=4444 (David Kamau)');
  console.log('  Admin:    username=admin    pin=1234');
}

seed();
