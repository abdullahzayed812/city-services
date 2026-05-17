import { Router } from 'express';
import { TechniciansController } from '../controllers/technicians.controller';
import { authenticate, authorize } from '../../../shared/middlewares/auth.middleware';
import { uploadImage, uploadDocument } from '../../../core/storage';
import { UserRole } from '../../../shared/types';

const router = Router();
const ctrl = new TechniciansController();

router.use(authenticate);

// Public profile
router.get('/', ctrl.getAll);
router.get('/profile', authorize(UserRole.TECHNICIAN), ctrl.getProfile);
router.get('/me', authorize(UserRole.TECHNICIAN), ctrl.getProfile);
router.get('/me/documents', authorize(UserRole.TECHNICIAN), ctrl.getMyDocuments);
router.post('/me/documents', authorize(UserRole.TECHNICIAN), uploadDocument.fields([{ name: 'front', maxCount: 1 }, { name: 'back', maxCount: 1 }]), ctrl.uploadIdDocument);
router.get('/me/services', authorize(UserRole.TECHNICIAN), ctrl.getMyServices);
router.post('/me/services', authorize(UserRole.TECHNICIAN), ctrl.addService);
router.delete('/me/services/:categoryId', authorize(UserRole.TECHNICIAN), ctrl.removeService);
router.get('/:id', ctrl.getProfile);

// Technician self-management
router.patch('/profile', authorize(UserRole.TECHNICIAN), uploadImage.single('avatar'), ctrl.updateProfile);
router.patch('/availability', authorize(UserRole.TECHNICIAN), ctrl.updateAvailability);
router.patch('/location', authorize(UserRole.TECHNICIAN), ctrl.updateLocation);
router.post('/documents', authorize(UserRole.TECHNICIAN), uploadDocument.fields([{ name: 'front', maxCount: 1 }, { name: 'back', maxCount: 1 }]), ctrl.uploadIdDocument);
router.post('/services', authorize(UserRole.TECHNICIAN), ctrl.addService);
router.delete('/services/:categoryId', authorize(UserRole.TECHNICIAN), ctrl.removeService);
router.post('/portfolio', authorize(UserRole.TECHNICIAN), uploadImage.single('image'), ctrl.addPortfolioImage);
// /me/* aliases
router.get('/me/portfolio', authorize(UserRole.TECHNICIAN), ctrl.getMyPortfolio);
router.post('/me/portfolio', authorize(UserRole.TECHNICIAN), uploadImage.single('image'), ctrl.addPortfolioImage);
router.delete('/me/portfolio/:imageId', authorize(UserRole.TECHNICIAN), ctrl.deletePortfolioImage);

// Admin management
router.post('/:id/approve', authorize(UserRole.ADMIN), ctrl.approve);
router.post('/:id/reject', authorize(UserRole.ADMIN), ctrl.reject);

export default router;
