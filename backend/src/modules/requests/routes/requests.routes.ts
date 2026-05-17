import { Router } from 'express';
import { RequestsController } from '../controllers/requests.controller';
import { authenticate, authorize } from '../../../shared/middlewares/auth.middleware';
import { uploadImage } from '../../../core/storage';
import { UserRole } from '../../../shared/types';

const router = Router();
const ctrl = new RequestsController();

router.use(authenticate);

// Customer routes
router.post('/', uploadImage.array('images', 5), ctrl.create);
router.get('/my', ctrl.getMyRequests);
router.post('/:id/cancel', ctrl.cancel);

// Technician routes
router.get('/all', authorize(UserRole.TECHNICIAN), ctrl.getAllPending);
router.get('/nearby', authorize(UserRole.TECHNICIAN), ctrl.getNearby);
router.get('/my-jobs', authorize(UserRole.TECHNICIAN), ctrl.getMyJobs);
router.post('/:id/start', authorize(UserRole.TECHNICIAN), ctrl.markStarted);
router.post('/:id/complete', authorize(UserRole.TECHNICIAN), ctrl.markCompleted);

// Admin routes
router.get('/', authorize(UserRole.ADMIN), ctrl.getAllAdmin);
router.get('/admin/all', authorize(UserRole.ADMIN), ctrl.getAllAdmin);

// Shared (authenticated)
router.get('/:id/history', ctrl.getHistory);
router.get('/:id', ctrl.getOne);

export default router;
