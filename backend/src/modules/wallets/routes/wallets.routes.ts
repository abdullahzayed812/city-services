import { Router } from 'express';
import { WalletsController } from '../controllers/wallets.controller';
import { authenticate, authorize } from '../../../shared/middlewares/auth.middleware';
import { UserRole } from '../../../shared/types';

const router = Router();
const ctrl = new WalletsController();

router.use(authenticate);

router.get('/admin/transactions', authorize(UserRole.ADMIN), ctrl.getAdminTransactions);
router.get('/admin/withdrawals', authorize(UserRole.ADMIN), ctrl.getAdminWithdrawals);
router.post('/admin/withdrawals/:id/approve', authorize(UserRole.ADMIN), ctrl.approveWithdrawal);
router.post('/admin/withdrawals/:id/reject', authorize(UserRole.ADMIN), ctrl.rejectWithdrawal);

router.get('/', ctrl.getWallet);
router.get('/me', ctrl.getWallet);
router.get('/transactions', ctrl.getTransactions);
router.post('/withdraw', authorize(UserRole.TECHNICIAN), ctrl.requestWithdrawal);
router.get('/withdrawals', authorize(UserRole.TECHNICIAN), ctrl.getMyWithdrawals);

export default router;
