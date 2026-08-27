import { Router, Request, Response } from 'express';
import { db } from '../db/database';
import { authenticateFarmer, AuthenticatedRequest } from '../middleware/auth';

const router = Router();

// ============================================================
// POST /api/integrations/sms  — Send SMS via mock provider
// ============================================================
router.post('/', (req: Request, res: Response) => {
  const { phoneNumber, message } = req.body;

  if (!phoneNumber || !message) {
    res.status(400).json({ success: false, error: 'phoneNumber and message required' });
    return;
  }

  // Log and "send"
  console.log(`📱 [SMS] To: ${phoneNumber} | Message: ${message}`);
  db.prepare(`INSERT INTO sms_log (phone_number, message, status, provider) VALUES (?, ?, 'SENT', 'MOCK')`).run(phoneNumber, message);

  res.json({ success: true, message: 'SMS sent (mock provider)', data: { phoneNumber, message } });
});

// ============================================================
// GET /api/integrations/sms/log  — View SMS log (admin)
// ============================================================
router.get('/log', authenticateFarmer, (req: AuthenticatedRequest, res: Response) => {
  if (req.user?.role !== 'ADMIN') {
    res.status(403).json({ success: false, error: 'Admin only' });
    return;
  }
  const logs = db.prepare('SELECT * FROM sms_log ORDER BY created_at DESC LIMIT 100').all();
  res.json({ success: true, data: logs });
});

export default router;
