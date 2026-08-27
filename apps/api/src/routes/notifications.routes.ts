import { Router, Response } from 'express';
import { db } from '../db/database';
import { authenticateFarmer, AuthenticatedRequest } from '../middleware/auth';

const router = Router();

// ============================================================
// GET /api/farmers/:id/notifications
// ============================================================
router.get('/farmer/:farmerId', authenticateFarmer, (req: AuthenticatedRequest, res: Response) => {
  const requestedFarmerId = parseInt(req.params.farmerId);
  const user = req.user!;

  if (user.role !== 'ADMIN' && user.id !== requestedFarmerId) {
    res.status(403).json({ success: false, error: 'Access denied' });
    return;
  }

  const notifications = db.prepare(`
    SELECT * FROM notifications
    WHERE farmer_id = ?
    ORDER BY created_at DESC
    LIMIT 50
  `).all(requestedFarmerId);

  const unreadCount = (db.prepare('SELECT COUNT(*) as count FROM notifications WHERE farmer_id = ? AND read = 0').get(requestedFarmerId) as any).count;

  res.json({ success: true, data: notifications, unread_count: unreadCount });
});

// ============================================================
// PUT /api/notifications/:id/read  — Mark as read
// ============================================================
router.put('/:id/read', authenticateFarmer, (req: AuthenticatedRequest, res: Response) => {
  const id = parseInt(req.params.id);
  const user = req.user!;

  const notification = db.prepare('SELECT * FROM notifications WHERE id = ?').get(id) as any;
  if (!notification) {
    res.status(404).json({ success: false, error: 'Notification not found' });
    return;
  }

  if (user.role !== 'ADMIN' && notification.farmer_id !== user.id) {
    res.status(403).json({ success: false, error: 'Access denied' });
    return;
  }

  db.prepare('UPDATE notifications SET read = 1 WHERE id = ?').run(id);
  res.json({ success: true, message: 'Notification marked as read' });
});

// ============================================================
// PUT /api/notifications/farmer/:farmerId/read-all
// ============================================================
router.put('/farmer/:farmerId/read-all', authenticateFarmer, (req: AuthenticatedRequest, res: Response) => {
  const requestedFarmerId = parseInt(req.params.farmerId);
  const user = req.user!;

  if (user.role !== 'ADMIN' && user.id !== requestedFarmerId) {
    res.status(403).json({ success: false, error: 'Access denied' });
    return;
  }

  db.prepare('UPDATE notifications SET read = 1 WHERE farmer_id = ?').run(requestedFarmerId);
  res.json({ success: true, message: 'All notifications marked as read' });
});

export default router;
