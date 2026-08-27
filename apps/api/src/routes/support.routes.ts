import { Router, Request, Response } from 'express';
import { db } from '../db/database';
import { authenticateFarmer, AuthenticatedRequest } from '../middleware/auth';
import { auditLog } from '../db/helpers';

const router = Router();

// ============================================================
// POST /api/support  — Create support request
// ============================================================
router.post('/', authenticateFarmer, (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;
  const { issue_type = 'GENERAL', description } = req.body;

  if (!description) {
    res.status(400).json({ success: false, error: 'Description is required' });
    return;
  }

  const result = db.prepare(`
    INSERT INTO support_requests (farmer_id, issue_type, description, status)
    VALUES (?, ?, ?, 'OPEN')
  `).run(user.id, issue_type, description);

  auditLog('FARMER', String(user.id), 'SUPPORT_REQUEST_CREATED', 'support_requests', String(result.lastInsertRowid));

  res.status(201).json({
    success: true,
    message: 'Support request submitted. Villagio will contact you shortly.',
    data: db.prepare('SELECT * FROM support_requests WHERE id = ?').get(result.lastInsertRowid),
  });
});

// ============================================================
// GET /api/products  — Product catalog (public)
// ============================================================
export const productsRouter = Router();

productsRouter.get('/', (_req: Request, res: Response) => {
  const products = db.prepare('SELECT * FROM products WHERE active = 1 ORDER BY name').all();
  res.json({ success: true, data: products });
});

export default router;
