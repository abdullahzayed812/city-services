import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller';
import { validate } from '../../../shared/middlewares/validate.middleware';
import { authenticate } from '../../../shared/middlewares/auth.middleware';
import {
  registerCustomerSchema,
  registerTechnicianSchema,
  loginSchema,
  verifyOtpSchema,
  requestOtpSchema,
  refreshTokenSchema,
  resetPasswordSchema,
} from '../dtos/auth.dto';

const router = Router();
const ctrl = new AuthController();

// Public routes
router.post('/register/customer', validate(registerCustomerSchema), ctrl.registerCustomer);
router.post('/register/technician', validate(registerTechnicianSchema), ctrl.registerTechnician);
router.post('/login', validate(loginSchema), ctrl.login);
router.post('/verify-otp', validate(verifyOtpSchema), ctrl.verifyOtp);
router.post('/request-otp', validate(requestOtpSchema), ctrl.requestOtp);
router.post('/refresh-token', validate(refreshTokenSchema), ctrl.refreshToken);
router.post('/refresh', validate(refreshTokenSchema), ctrl.refreshToken);
router.post('/reset-password', validate(resetPasswordSchema), ctrl.resetPassword);

// Protected routes
router.post('/logout', authenticate, ctrl.logout);

export default router;
