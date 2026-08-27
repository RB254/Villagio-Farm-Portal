import { Router, Response } from 'express';
import { db } from '../db/database';
import { auditLog, formatPhoneKE, isValidPhone } from '../db/helpers';
import { authenticateFarmer, authenticateAdmin, AuthenticatedRequest } from '../middleware/auth';

const router = Router();

// ============================================================
// GET /api/farmers/:id  (farmer can only get own, admin gets any)
// ============================================================
router.get('/:id', authenticateFarmer, (req: AuthenticatedRequest, res: Response) => {
  const requestedId = parseInt(req.params.id);
  const user = req.user!;

  // Farmers can only view own profile; admins unrestricted
  if (user.role !== 'ADMIN' && user.id !== requestedId) {
    res.status(403).json({ success: false, error: 'Access denied' });
    return;
  }

  const farmer = db.prepare(`
    SELECT id, farmer_id, full_name, phone, county, sub_county, location,
           latitude, longitude, preferred_language, preferred_channel, status, created_at, updated_at
    FROM farmers WHERE id = ?
  `).get(requestedId) as any;

  if (!farmer) {
    res.status(404).json({ success: false, error: 'Farmer not found' });
    return;
  }

  res.json({ success: true, data: farmer });
});

// ============================================================
// PUT /api/farmers/:id  (farmer can only update own)
// ============================================================
router.put('/:id', authenticateFarmer, (req: AuthenticatedRequest, res: Response) => {
  const requestedId = parseInt(req.params.id);
  const user = req.user!;

  if (user.role !== 'ADMIN' && user.id !== requestedId) {
    res.status(403).json({ success: false, error: 'Access denied' });
    return;
  }

  const { full_name, county, sub_county, location, preferred_language, preferred_channel, latitude, longitude } = req.body;

  const fields: string[] = [];
  const values: any[] = [];

  if (full_name) { fields.push('full_name = ?'); values.push(full_name); }
  if (county) { fields.push('county = ?'); values.push(county); }
  if (sub_county) { fields.push('sub_county = ?'); values.push(sub_county); }
  if (location) { fields.push('location = ?'); values.push(location); }
  if (preferred_language) { fields.push('preferred_language = ?'); values.push(preferred_language); }
  if (preferred_channel) { fields.push('preferred_channel = ?'); values.push(preferred_channel); }
  if (latitude !== undefined) { fields.push('latitude = ?'); values.push(latitude); }
  if (longitude !== undefined) { fields.push('longitude = ?'); values.push(longitude); }

  if (fields.length === 0) {
    res.status(400).json({ success: false, error: 'No fields to update' });
    return;
  }

  fields.push("updated_at = datetime('now')");
  values.push(requestedId);

  db.prepare(`UPDATE farmers SET ${fields.join(', ')} WHERE id = ?`).run(...values);
  auditLog('FARMER', String(user.id), 'FARMER_UPDATED', 'farmers', String(requestedId));

  const updated = db.prepare('SELECT id, farmer_id, full_name, phone, county, sub_county, location, latitude, longitude, preferred_language, preferred_channel, status FROM farmers WHERE id = ?').get(requestedId);
  res.json({ success: true, data: updated, message: 'Profile updated successfully' });
});

// ============================================================
// POST /api/farmers  (admin only — direct creation)
// ============================================================
router.post('/', authenticateAdmin, (req: AuthenticatedRequest, res: Response) => {
  res.status(501).json({ success: false, error: 'Use /api/auth/register for farmer creation' });
});

export default router;
