import { Router } from 'express';
import { AnalyticsController } from '../controllers/analytics.controller';
import { authenticate, authorize } from '../../../shared/middlewares/auth.middleware';
import { UserRole } from '../../../shared/types';

const router = Router();
const ctrl = new AnalyticsController();

router.use(authenticate, authorize(UserRole.ADMIN));

router.get('/kpis', ctrl.getKPIs);
router.get('/requests-chart', ctrl.getRequestsChart);
router.get('/top-services', ctrl.getTopServices);
router.get('/top-technicians', ctrl.getTopTechnicians);
router.get('/revenue', ctrl.getRevenueReport);

export default router;
