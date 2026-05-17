import { Router } from 'express';
import { NotificationsController } from '../controllers/notifications.controller';
import { authenticate, authorize } from '../../../shared/middlewares/auth.middleware';
import { UserRole } from '../../../shared/types';

const router = Router();
const ctrl = new NotificationsController();

router.use(authenticate);

router.get('/admin/logs', authorize(UserRole.ADMIN), ctrl.getAdminLogs);
router.post('/admin/broadcast', authorize(UserRole.ADMIN), ctrl.broadcast);

router.get('/', ctrl.getAll);
router.get('/unread', ctrl.getUnread);
router.patch('/:id/read', ctrl.markRead);
router.patch('/read-all', ctrl.markAllRead);

export default router;
