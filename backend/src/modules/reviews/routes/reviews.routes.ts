import { Router } from 'express';
import { ReviewsController } from '../controllers/reviews.controller';
import { authenticate, authorize } from '../../../shared/middlewares/auth.middleware';
import { UserRole } from '../../../shared/types';

const router = Router();
const ctrl = new ReviewsController();

router.use(authenticate);

router.post('/', authorize(UserRole.CUSTOMER), ctrl.submitReview);
router.get('/technician/:technicianId', ctrl.getTechnicianReviews);
router.post('/:id/report', ctrl.reportReview);

export default router;
