import { Router } from 'express';
import { CustomersController } from '../controllers/customers.controller';
import { authenticate, authorize } from '../../../shared/middlewares/auth.middleware';
import { UserRole } from '../../../shared/types';

const router = Router();
const ctrl = new CustomersController();

// Admin routes
router.get('/', authenticate, authorize(UserRole.ADMIN), ctrl.getAll);

// Customer self-service routes
router.get('/me/addresses', authenticate, authorize(UserRole.CUSTOMER), ctrl.getAddresses);
router.post('/me/addresses', authenticate, authorize(UserRole.CUSTOMER), ctrl.addAddress);
router.put('/me/addresses/:id', authenticate, authorize(UserRole.CUSTOMER), ctrl.updateAddress);
router.delete('/me/addresses/:id', authenticate, authorize(UserRole.CUSTOMER), ctrl.deleteAddress);

export default router;
