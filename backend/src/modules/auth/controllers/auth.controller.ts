import { Request, Response } from 'express';
import { AuthService } from '../services/auth.service';
import { sendSuccess, sendCreated } from '../../../shared/utils/response';
import { asyncHandler } from '../../../shared/middlewares/error.middleware';

export class AuthController {
  private readonly service: AuthService;

  constructor() {
    this.service = new AuthService();
  }

  registerCustomer = asyncHandler(async (req: Request, res: Response) => {
    const { phone, full_name, password, email } = req.body;
    const result = await this.service.registerCustomer({ phone, fullName: full_name, password, email });
    sendCreated(res, result, 'تم إنشاء الحساب بنجاح');
  });

  registerTechnician = asyncHandler(async (req: Request, res: Response) => {
    const { phone, full_name, password, email, bio, years_experience } = req.body;
    const result = await this.service.registerTechnician({
      phone, fullName: full_name, password, email, bio, yearsExperience: years_experience,
    });
    sendCreated(res, result, 'تم إنشاء حساب الفني بنجاح');
  });

  login = asyncHandler(async (req: Request, res: Response) => {
    const { phone, password, fcm_token } = req.body;
    const result = await this.service.login({ phone, password, fcmToken: fcm_token });
    sendSuccess(res, result, 'تم تسجيل الدخول بنجاح');
  });

  verifyOtp = asyncHandler(async (req: Request, res: Response) => {
    const { phone, code, purpose } = req.body;
    const result = await this.service.verifyOtp({ phone, code, purpose });
    sendSuccess(res, result, 'تم التحقق بنجاح');
  });

  requestOtp = asyncHandler(async (req: Request, res: Response) => {
    const { phone, purpose } = req.body;
    const result = await this.service.requestOtp({ phone, purpose });
    sendSuccess(res, result, 'تم إرسال رمز التحقق');
  });

  refreshToken = asyncHandler(async (req: Request, res: Response) => {
    const { refresh_token } = req.body;
    const tokens = await this.service.refreshToken(refresh_token);
    sendSuccess(res, tokens, 'تم تجديد رمز الوصول');
  });

  logout = asyncHandler(async (req: Request, res: Response) => {
    const { refresh_token } = req.body;
    await this.service.logout(req.user!.userId, refresh_token);
    sendSuccess(res, null, 'تم تسجيل الخروج بنجاح');
  });

  resetPassword = asyncHandler(async (req: Request, res: Response) => {
    const { phone, otp_code, new_password } = req.body;
    await this.service.resetPassword({ phone, otpCode: otp_code, newPassword: new_password });
    sendSuccess(res, null, 'تم تغيير كلمة المرور بنجاح');
  });
}
