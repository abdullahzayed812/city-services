import { Router } from 'express';
import { ProposalsController } from '../controllers/proposals.controller';
import { authenticate, authorize } from '../../../shared/middlewares/auth.middleware';
import { UserRole } from '../../../shared/types';

const router = Router();
const ctrl = new ProposalsController();

router.use(authenticate);

// Technician: submit & manage own proposals
router.post('/', authorize(UserRole.TECHNICIAN), ctrl.submit);
router.post('/:id/withdraw', authorize(UserRole.TECHNICIAN), ctrl.withdraw);
router.get('/my', authorize(UserRole.TECHNICIAN), ctrl.getMyProposals);

// Customer or Admin: view proposals for a request
router.get('/', authorize(UserRole.CUSTOMER, UserRole.ADMIN), ctrl.getForRequest);
router.get('/request/:requestId', authorize(UserRole.CUSTOMER, UserRole.ADMIN), ctrl.getForRequest);
router.post('/:id/accept', authorize(UserRole.CUSTOMER), ctrl.accept);
router.post('/:id/reject', authorize(UserRole.CUSTOMER), ctrl.reject);

export default router;
