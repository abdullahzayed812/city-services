import { Router } from 'express';
import authRoutes from '../modules/auth/routes/auth.routes';
import techniciansRoutes from '../modules/technicians/routes/technicians.routes';
import servicesRoutes from '../modules/services/routes/services.routes';
import requestsRoutes from '../modules/requests/routes/requests.routes';
import proposalsRoutes from '../modules/proposals/routes/proposals.routes';
import notificationsRoutes from '../modules/notifications/routes/notifications.routes';
import walletsRoutes from '../modules/wallets/routes/wallets.routes';
import reviewsRoutes from '../modules/reviews/routes/reviews.routes';
import analyticsRoutes from '../modules/analytics/routes/analytics.routes';
import customersRoutes from '../modules/customers/routes/customers.routes';
import categoriesRoutes from '../modules/categories/routes/categories.routes';
import chatsRoutes from '../modules/chats/routes/chats.routes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/technicians', techniciansRoutes);
router.use('/services', servicesRoutes);
router.use('/requests', requestsRoutes);
router.use('/proposals', proposalsRoutes);
router.use('/notifications', notificationsRoutes);
router.use('/wallets', walletsRoutes);
router.use('/wallet', walletsRoutes);
router.use('/reviews', reviewsRoutes);
router.use('/analytics', analyticsRoutes);
router.use('/customers', customersRoutes);
router.use('/categories', categoriesRoutes);
router.use('/chats', chatsRoutes);

export default router;
