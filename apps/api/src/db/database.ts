import { DatabaseSync, StatementSync } from 'node:sqlite';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';

dotenv.config();

const DB_PATH = process.env.DB_PATH || './villagio.db';
const resolvedPath = path.resolve(DB_PATH);

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
}
