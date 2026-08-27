import { Router, Request, Response } from 'express';
import { db } from '../db/database';
import { hashPin, verifyPin, generateFarmerId, formatPhoneKE, isValidPhone, auditLog } from '../db/helpers';
import { generateToken, authenticateFarmer, AuthenticatedRequest } from '../middleware/auth';

const router = Router();

// ============================================================
// POST /api/auth/register
// ============================================================
router.post('/register', (req: Request, res: Response) => {
  const { full_name, phone, pin, county, sub_county, location, preferred_language, latitude, longitude } = req.body;

  // Validate required fields
  if (!full_name || !phone || !pin || !county || !sub_county || !location) {
    res.status(400).json({ success: false, error: 'Required fields: full_name, phone, pin, county, sub_county, location' });
    return;
  }

  if (pin.length !== 4 || !/^\d{4}$/.test(pin)) {
    res.status(400).json({ success: false, error: 'PIN must be exactly 4 digits' });
    return;
  }

  const normalizedPhone = formatPhoneKE(phone);
  if (!isValidPhone(normalizedPhone)) {
    res.status(400).json({ success: false, error: 'Invalid Kenyan phone number format' });
    return;
  }

  // Check duplicate phone
  const existing = db.prepare('SELECT id FROM farmers WHERE phone = ?').get(normalizedPhone);
  if (existing) {
    res.status(409).json({ success: false, error: 'A farmer with this phone number already exists' });
    return;
  }

  const farmer_id = generateFarmerId();
  const pin_hash = hashPin(pin);

  try {
    const stmt = db.prepare(`
      INSERT INTO farmers (farmer_id, full_name, phone, pin_hash, county, sub_county, location, latitude, longitude, preferred_language, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'ACTIVE')
    `);
    const result = stmt.run(
      farmer_id, full_name, normalizedPhone, pin_hash,
      county, sub_county, location,
      latitude || null, longitude || null,
      preferred_language || 'en'
    );

    const newId = result.lastInsertRowid as number;
    auditLog('SYSTEM', 'SYSTEM', 'FARMER_REGISTERED', 'farmers', String(newId), { farmer_id, phone: normalizedPhone });

    const token = generateToken({ id: newId, farmer_id, phone: normalizedPhone, role: 'FARMER' });

    res.status(201).json({
      success: true,
      message: 'Karibu Villagio! Your farmer account has been created successfully.',
      data: { farmer_id, token, id: newId },
    });
  } catch (err: any) {
    console.error('Registration error:', err);
    res.status(500).json({ success: false, error: 'Registration failed. Please try again.' });
  }
});

// ============================================================
// POST /api/auth/login
// ============================================================
router.post('/login', (req: Request, res: Response) => {
  const { phone, pin } = req.body;

  if (!phone || !pin) {
    res.status(400).json({ success: false, error: 'Phone number and PIN are required' });
    return;
  }

  const normalizedPhone = formatPhoneKE(phone);
  const farmer = db.prepare('SELECT * FROM farmers WHERE phone = ?').get(normalizedPhone) as any;

  if (!farmer) {
    res.status(401).json({ success: false, error: 'No farmer account found with this phone number' });
    return;
  }

  if (farmer.status !== 'ACTIVE') {
    res.status(403).json({ success: false, error: 'Your account is not active. Please contact Villagio support.' });
    return;
  }

  if (!verifyPin(pin, farmer.pin_hash)) {
    res.status(401).json({ success: false, error: 'Incorrect PIN. Please try again.' });
    return;
  }

  const token = generateToken({ id: farmer.id, farmer_id: farmer.farmer_id, phone: farmer.phone, role: 'FARMER' });
  auditLog('FARMER', String(farmer.id), 'FARMER_LOGIN', 'farmers', String(farmer.id));

  res.json({
    success: true,
    data: {
      token,
      farmer: {
        id: farmer.id,
        farmer_id: farmer.farmer_id,
        full_name: farmer.full_name,
        phone: farmer.phone,
        county: farmer.county,
        sub_county: farmer.sub_county,
        location: farmer.location,
        preferred_language: farmer.preferred_language,
        preferred_channel: farmer.preferred_channel,
        status: farmer.status,
      },
    },
  });
});

// ============================================================
// POST /api/auth/admin/login
// ============================================================
router.post('/admin/login', (req: Request, res: Response) => {
  const { username, pin } = req.body;

  if (!username || !pin) {
    res.status(400).json({ success: false, error: 'Username and PIN are required' });
    return;
  }

  const admin = db.prepare('SELECT * FROM admins WHERE username = ?').get(username) as any;
  if (!admin) {
    res.status(401).json({ success: false, error: 'Invalid credentials' });
    return;
  }

  if (!verifyPin(pin, admin.pin_hash)) {
    res.status(401).json({ success: false, error: 'Invalid credentials' });
    return;
  }

  const token = generateToken({ id: admin.id, farmer_id: `ADMIN-${admin.id}`, phone: username, role: 'ADMIN' });

  res.json({
    success: true,
    data: { token, admin: { id: admin.id, username: admin.username, role: admin.role } },
  });
});

// ============================================================
// GET /api/auth/me  (verify token & return farmer data)
// ============================================================
router.get('/me', authenticateFarmer, (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;
  const farmer = db.prepare('SELECT id, farmer_id, full_name, phone, county, sub_county, location, preferred_language, preferred_channel, status, created_at FROM farmers WHERE id = ?').get(user.id) as any;
  if (!farmer) {
    res.status(404).json({ success: false, error: 'Farmer not found' });
    return;
  }
  res.json({ success: true, data: farmer });
});

export default router;
