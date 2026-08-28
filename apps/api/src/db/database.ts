import { DatabaseSync, StatementSync } from 'node:sqlite';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';

dotenv.config();

const DB_PATH = process.env.DB_PATH || './villagio.db';
const resolvedPath = path.isAbsolute(DB_PATH)
  ? DB_PATH
  : path.resolve(process.cwd(), DB_PATH);

// Ensure directory exists
const dir = path.dirname(resolvedPath);
if (!fs.existsSync(dir)) {
  fs.mkdirSync(dir, { recursive: true });
}

export const db = new DatabaseSync(resolvedPath);

// Enable WAL mode and foreign keys
db.exec('PRAGMA journal_mode = WAL;');
db.exec('PRAGMA foreign_keys = ON;');

// ============================================================
// HELPER: run a prepared statement with arbitrary params
// node:sqlite StatementSync.run() accepts rest args
// ============================================================
export function run(sql: string, ...params: any[]): { lastInsertRowid: number | bigint; changes: number } {
  const stmt = db.prepare(sql);
  return stmt.run(...params) as any;
}

export function get<T = any>(sql: string, ...params: any[]): T | undefined {
  const stmt = db.prepare(sql);
  return stmt.get(...params) as T | undefined;
}

export function all<T = any>(sql: string, ...params: any[]): T[] {
  const stmt = db.prepare(sql);
  return stmt.all(...params) as T[];
}

export function exec(sql: string): void {
  db.exec(sql);
}

export function initializeDatabase(): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      category TEXT NOT NULL DEFAULT 'vegetable',
      default_unit TEXT NOT NULL DEFAULT 'sack',
      kg_per_unit REAL NOT NULL DEFAULT 90,
      active INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS farmers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      farmer_id TEXT NOT NULL UNIQUE,
      full_name TEXT NOT NULL,
      phone TEXT NOT NULL UNIQUE,
      pin_hash TEXT NOT NULL,
      county TEXT NOT NULL,
      sub_county TEXT NOT NULL,
      location TEXT NOT NULL,
      latitude REAL,
      longitude REAL,
      preferred_language TEXT NOT NULL DEFAULT 'en',
      preferred_channel TEXT NOT NULL DEFAULT 'WEB',
      status TEXT NOT NULL DEFAULT 'ACTIVE',
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS admins (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT NOT NULL UNIQUE,
      pin_hash TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'ADMIN',
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS farmer_produce (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      submission_id TEXT NOT NULL UNIQUE,
      farmer_id INTEGER NOT NULL REFERENCES farmers(id),
      product_id INTEGER NOT NULL REFERENCES products(id),
      quantity REAL NOT NULL,
      unit TEXT NOT NULL DEFAULT 'sack',
      estimated_kg REAL NOT NULL,
      availability_date TEXT NOT NULL,
      quality_estimate TEXT NOT NULL DEFAULT 'GOOD',
      location TEXT NOT NULL,
      latitude REAL,
      longitude REAL,
      source_channel TEXT NOT NULL DEFAULT 'WEB',
      status TEXT NOT NULL DEFAULT 'SUBMITTED',
      notes TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS logistics_partners (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      code TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      contact_phone TEXT,
      active INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS collection_requests (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      collection_id TEXT NOT NULL UNIQUE,
      farmer_id INTEGER NOT NULL REFERENCES farmers(id),
      produce_submission_id INTEGER NOT NULL REFERENCES farmer_produce(id),
      quantity REAL NOT NULL,
      pickup_location TEXT NOT NULL,
      scheduled_date TEXT NOT NULL,
      time_window TEXT NOT NULL DEFAULT '08:00-12:00',
      logistics_partner TEXT NOT NULL DEFAULT 'FTMA',
      vehicle_id TEXT,
      driver_id TEXT,
      status TEXT NOT NULL DEFAULT 'REQUESTED',
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS notifications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      farmer_id INTEGER NOT NULL REFERENCES farmers(id),
      type TEXT NOT NULL,
      title TEXT NOT NULL,
      message TEXT NOT NULL,
      channel TEXT NOT NULL DEFAULT 'WEB',
      read INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS payments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      farmer_id INTEGER NOT NULL REFERENCES farmers(id),
      produce_submission_id INTEGER REFERENCES farmer_produce(id),
      amount REAL NOT NULL,
      currency TEXT NOT NULL DEFAULT 'KES',
      method TEXT NOT NULL DEFAULT 'MPESA',
      status TEXT NOT NULL DEFAULT 'PENDING',
      transaction_reference TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS audit_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      actor TEXT NOT NULL,
      actor_id TEXT NOT NULL,
      action TEXT NOT NULL,
      entity TEXT NOT NULL,
      entity_id TEXT NOT NULL,
      timestamp TEXT NOT NULL DEFAULT (datetime('now')),
      metadata TEXT
    );

    CREATE TABLE IF NOT EXISTS exceptions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      exception_id TEXT NOT NULL UNIQUE,
      type TEXT NOT NULL,
      severity TEXT NOT NULL DEFAULT 'MEDIUM',
      related_entity TEXT NOT NULL,
      related_entity_id TEXT NOT NULL,
      description TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'OPEN',
      assigned_person TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      resolved_at TEXT
    );

    CREATE TABLE IF NOT EXISTS demand_data (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      product_id INTEGER NOT NULL REFERENCES products(id),
      quantity_sacks REAL NOT NULL,
      demand_source TEXT NOT NULL DEFAULT 'HOUSEHOLD',
      location TEXT NOT NULL DEFAULT 'Nairobi',
      demand_date TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS support_requests (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      farmer_id INTEGER NOT NULL REFERENCES farmers(id),
      issue_type TEXT NOT NULL DEFAULT 'GENERAL',
      description TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'OPEN',
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      resolved_at TEXT
    );

    CREATE TABLE IF NOT EXISTS ussd_sessions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      session_id TEXT NOT NULL UNIQUE,
      phone_number TEXT NOT NULL,
      state TEXT NOT NULL DEFAULT 'MAIN_MENU',
      data TEXT NOT NULL DEFAULT '{}',
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS ivr_sessions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      session_id TEXT NOT NULL UNIQUE,
      phone_number TEXT NOT NULL,
      language TEXT NOT NULL DEFAULT 'en',
      state TEXT NOT NULL DEFAULT 'WELCOME',
      data TEXT NOT NULL DEFAULT '{}',
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS sms_log (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      phone_number TEXT NOT NULL,
      message TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'SENT',
      provider TEXT NOT NULL DEFAULT 'MOCK',
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);

  console.log('✅ Database initialized successfully');
  autoSeedIfEmpty();
}

function autoSeedIfEmpty(): void {
  try {
    const adminCount = db.prepare('SELECT count(*) as count FROM admins').get() as { count: number };
    if (adminCount && adminCount.count > 0) {
      return;
    }

    console.log('🌱 Database is empty. Auto-seeding demo data for live testing...');

    // Products
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
      productIds[p.name] = Number(res.lastInsertRowid);
    }

    // Admin (username: admin, pin: 1234)
    // Precalculated hash for '1234' with 10 salt rounds
    const adminPinHash = '$2a$10$tZ8k04KqZ4uQZfI5r6y99uxUoW3sMvj2u0g5aK.Q7W9Bv3n1p2Zae';
    db.prepare(`
      INSERT INTO admins (username, pin_hash, role) VALUES (?, ?, 'ADMIN')
    `).run('admin', adminPinHash);

    // Logistics partner
    db.prepare(`
      INSERT INTO logistics_partners (code, name, contact_phone, active) VALUES (?, ?, ?, 1)
    `).run('FTMA', 'Farm To Market Alliance Logistics', '+254700000001');

    // Farmers A, B, C, D
    const farmersData = [
      { id: 'VLG-FMR-000001', name: 'Alice Wanjiku', phone: '+254711000001', county: 'Kiambu', sub: 'Limuru', loc: 'Limuru, Kiambu', lat: -1.1167, lng: 36.6333, pinHash: '$2a$10$oA1vFvU8MwqoIqfL2M6uOujG0oW3sMvj2u0g5aK.Q7W9Bv3n1p2Za' }, // 1111
      { id: 'VLG-FMR-000002', name: 'Bernard Mwangi', phone: '+254711000002', county: 'Kiambu', sub: 'Kiambu Town', loc: 'Kiambu, Kiambu', lat: -1.1733, lng: 36.8267, pinHash: '$2a$10$oA1vFvU8MwqoIqfL2M6uOujG0oW3sMvj2u0g5aK.Q7W9Bv3n1p2Zb' }, // 2222
      { id: 'VLG-FMR-000003', name: 'Caroline Achieng', phone: '+254711000003', county: 'Kiambu', sub: 'Ruiru', loc: 'Ruiru, Kiambu', lat: -1.1452, lng: 36.9604, pinHash: '$2a$10$oA1vFvU8MwqoIqfL2M6uOujG0oW3sMvj2u0g5aK.Q7W9Bv3n1p2Zc' }, // 3333
      { id: 'VLG-FMR-000004', name: 'David Kamau', phone: '+254711000004', county: 'Murang\'a', sub: 'Kigumo', loc: 'Kigumo, Murang\'a', lat: -0.7378, lng: 36.9738, pinHash: '$2a$10$oA1vFvU8MwqoIqfL2M6uOujG0oW3sMvj2u0g5aK.Q7W9Bv3n1p2Zd' }, // 4444
    ];

    // Use bcrypt directly to guarantee exact matching pin hashes
    const bcrypt = require('bcryptjs');
    const fAlicePin = bcrypt.hashSync('1111', 10);
    const fBernardPin = bcrypt.hashSync('2222', 10);
    const fCarolinePin = bcrypt.hashSync('3333', 10);
    const fDavidPin = bcrypt.hashSync('4444', 10);
    const adminHash = bcrypt.hashSync('1234', 10);

    db.prepare(`UPDATE admins SET pin_hash = ? WHERE username = 'admin'`).run(adminHash);

    const farmerPins = [fAlicePin, fBernardPin, fCarolinePin, fDavidPin];
    const farmerIds: number[] = [];

    for (let i = 0; i < farmersData.length; i++) {
      const f = farmersData[i];
      const res = db.prepare(`
        INSERT INTO farmers (farmer_id, full_name, phone, pin_hash, county, sub_county, location, latitude, longitude, preferred_language, preferred_channel, status)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'en', 'WEB', 'ACTIVE')
      `).run(f.id, f.name, f.phone, farmerPins[i], f.county, f.sub, f.loc, f.lat, f.lng);
      farmerIds.push(Number(res.lastInsertRowid));
    }

    // Demo produce
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];

    const produceData = [
      { farmer_idx: 0, product: 'Potatoes', qty: 5, channel: 'WEB', sub_id: 'VLG-PRD-000001', status: 'SUBMITTED' },
      { farmer_idx: 1, product: 'Potatoes', qty: 10, channel: 'USSD', sub_id: 'VLG-PRD-000002', status: 'SUBMITTED' },
      { farmer_idx: 2, product: 'Potatoes', qty: 3, channel: 'IVR', sub_id: 'VLG-PRD-000003', status: 'SUBMITTED' },
      { farmer_idx: 3, product: 'Potatoes', qty: 8, channel: 'WEB', sub_id: 'VLG-PRD-000004', status: 'COLLECTED' },
      { farmer_idx: 0, product: 'Tomatoes', qty: 4, channel: 'WEB', sub_id: 'VLG-PRD-000005', status: 'SUBMITTED' },
      { farmer_idx: 1, product: 'Onions', qty: 6, channel: 'USSD', sub_id: 'VLG-PRD-000006', status: 'AVAILABLE' },
    ];

    const produceIds: number[] = [];
    for (const p of produceData) {
      const pid = productIds[p.product] || 1;
      const fid = farmerIds[p.farmer_idx] || 1;
      const kg = p.qty * (products.find((x) => x.name === p.product)?.kg_per_unit || 90);
      const loc = farmersData[p.farmer_idx]?.loc || 'Limuru, Kiambu';
      const res = db.prepare(`
        INSERT INTO farmer_produce (submission_id, farmer_id, product_id, quantity, unit, estimated_kg, availability_date, quality_estimate, location, source_channel, status)
        VALUES (?, ?, ?, ?, 'sack', ?, ?, 'GOOD', ?, ?, ?)
      `).run(p.sub_id, fid, pid, p.qty, kg, tomorrowStr, loc, p.channel, p.status);
      produceIds.push(Number(res.lastInsertRowid));
    }

    // Demand
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
      `).run(productIds[d.product] || 1, d.qty, d.source, d.location);
    }

    // Demo collection and payment
    db.prepare(`
      INSERT INTO collection_requests (collection_id, farmer_id, produce_submission_id, quantity, pickup_location, scheduled_date, time_window, logistics_partner, vehicle_id, driver_id, status)
      VALUES ('COL-00001', ?, ?, 8, ?, date('now', '-1 days'), '08:00-12:00', 'FTMA', 'FTMA-TRUCK-003', 'FTMA-DRV-007', 'COMPLETED')
    `).run(farmerIds[3], produceIds[3], farmersData[3].loc);

    db.prepare(`
      INSERT INTO payments (farmer_id, produce_submission_id, amount, currency, method, status, transaction_reference)
      VALUES (?, ?, 9600, 'KES', 'MPESA', 'COMPLETED', 'MPESA-1234567890-ABC')
    `).run(farmerIds[3], produceIds[3]);

    console.log('✅ Demo dataset auto-seeded successfully');
  } catch (err) {
    console.error('Auto-seed warning:', err);
  }
}
