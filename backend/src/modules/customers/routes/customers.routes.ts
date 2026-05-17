import { Router } from 'express';
import { CustomersController } from '../controllers/customers.controller';
import { authenticate, authorize } from '../../../shared/middlewares/auth.middleware';
import { UserRole } from '../../../shared/types';

const router = Router();
const ctrl = new CustomersController();

router.use(authenticate, authorize(UserRole.ADMIN));

router.get('/', ctrl.getAll);

export default router;
