import { Router } from 'express';
import { CategoriesController } from '../controllers/categories.controller';
import { authenticate, authorize } from '../../../shared/middlewares/auth.middleware';
import { UserRole } from '../../../shared/types';

const router = Router();
const ctrl = new CategoriesController();

router.get('/', ctrl.getAll);

router.post('/', authenticate, authorize(UserRole.ADMIN), ctrl.create);
router.put('/:id', authenticate, authorize(UserRole.ADMIN), ctrl.update);
router.delete('/:id', authenticate, authorize(UserRole.ADMIN), ctrl.remove);

export default router;
