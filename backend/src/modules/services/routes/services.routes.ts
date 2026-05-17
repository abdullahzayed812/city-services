import { Router } from 'express';
import { ServicesController } from '../controllers/services.controller';
import { authenticate, authorize } from '../../../shared/middlewares/auth.middleware';
import { uploadImage } from '../../../core/storage';
import { UserRole } from '../../../shared/types';

const router = Router();
const ctrl = new ServicesController();

// Public
router.get('/', ctrl.getAll);
router.get('/:id', ctrl.getOne);

// Admin
router.post('/', authenticate, authorize(UserRole.ADMIN), uploadImage.single('icon'), ctrl.create);
router.patch('/:id', authenticate, authorize(UserRole.ADMIN), uploadImage.single('icon'), ctrl.update);
router.delete('/:id', authenticate, authorize(UserRole.ADMIN), ctrl.remove);

export default router;
