import { db } from './database';
import bcrypt from 'bcryptjs';

export function auditLog(
  actor: string,
  actorId: string,
  action: string,
  entity: string,
  entityId: string,
  metadata?: object
): void {
  try {
    const stmt = db.prepare(`
      INSERT INTO audit_logs (actor, actor_id, action, entity, entity_id, timestamp, metadata)
      VALUES (?, ?, ?, ?, ?, datetime('now'), ?)
    `);
    stmt.run(actor, actorId, action, entity, entityId, metadata ? JSON.stringify(metadata) : null);
  } catch (err) {
    console.error('Audit log error:', err);
  }
}

export function generateFarmerId(): string {
  const stmt = db.prepare('SELECT COUNT(*) as count FROM farmers');
  const result = stmt.get() as { count: number };
  const num = (result.count + 1).toString().padStart(6, '0');
  return `VLG-FMR-${num}`;
}

export function generateSubmissionId(): string {
  const stmt = db.prepare('SELECT COUNT(*) as count FROM farmer_produce');
  const result = stmt.get() as { count: number };
  const num = (result.count + 1).toString().padStart(6, '0');
  return `VLG-PRD-${num}`;
}

export function generateCollectionId(): string {
  const stmt = db.prepare('SELECT COUNT(*) as count FROM collection_requests');
  const result = stmt.get() as { count: number };
  const num = (result.count + 1).toString().padStart(5, '0');
  return `COL-${num}`;
}

export function generateExceptionId(): string {
  const stmt = db.prepare('SELECT COUNT(*) as count FROM exceptions');
  const result = stmt.get() as { count: number };
  const num = (result.count + 1).toString().padStart(5, '0');
  return `EXC-${num}`;
}

export function hashPin(pin: string): string {
  return bcrypt.hashSync(pin, 10);
}

export function verifyPin(pin: string, hash: string): boolean {
  return bcrypt.compareSync(pin, hash);
}

export function formatPhoneKE(phone: string): string {
  // Normalize Kenyan phone numbers to +254XXXXXXXXX
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.startsWith('254') && cleaned.length === 12) return `+${cleaned}`;
  if (cleaned.startsWith('0') && cleaned.length === 10) return `+254${cleaned.slice(1)}`;
  if (cleaned.startsWith('7') && cleaned.length === 9) return `+254${cleaned}`;
  return `+${cleaned}`;
}

export function isValidPhone(phone: string): boolean {
  const normalized = formatPhoneKE(phone);
  return /^\+254[17]\d{8}$/.test(normalized);
}

export function getKgPerSack(productId: number): number {
  const product = db.prepare('SELECT kg_per_unit FROM products WHERE id = ?').get(Number(productId)) as { kg_per_unit: number } | undefined;
  return product?.kg_per_unit ?? 90;
}
