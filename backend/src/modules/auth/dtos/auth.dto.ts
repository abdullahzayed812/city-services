import Joi from 'joi';

export const phoneSchema = Joi.string()
  .pattern(/^\+20[0-9]{10}$/)
  .required()
  .messages({
    'string.pattern.base': 'رقم الهاتف يجب أن يكون بالصيغة المصرية مثل: +201012345678',
    'any.required': 'رقم الهاتف مطلوب',
  });

export const registerCustomerSchema = Joi.object({
  phone: phoneSchema,
  full_name: Joi.string().min(3).max(100).required().messages({
    'string.min': 'الاسم يجب أن يكون 3 أحرف على الأقل',
    'any.required': 'الاسم الكامل مطلوب',
  }),
  password: Joi.string().min(8).required().messages({
    'string.min': 'كلمة المرور يجب أن تكون 8 أحرف على الأقل',
    'any.required': 'كلمة المرور مطلوبة',
  }),
  email: Joi.string().email().optional().messages({
    'string.email': 'البريد الإلكتروني غير صحيح',
  }),
});

export const registerTechnicianSchema = Joi.object({
  phone: phoneSchema,
  full_name: Joi.string().min(3).max(100).required(),
  password: Joi.string().min(8).required(),
  email: Joi.string().email().optional(),
  bio: Joi.string().max(500).optional(),
  years_experience: Joi.number().integer().min(0).max(50).optional(),
});

export const loginSchema = Joi.object({
  phone: phoneSchema,
  password: Joi.string().required().messages({
    'any.required': 'كلمة المرور مطلوبة',
  }),
  fcm_token: Joi.string().optional(),
});

export const verifyOtpSchema = Joi.object({
  phone: phoneSchema,
  code: Joi.string().length(6).pattern(/^[0-9]+$/).required().messages({
    'string.length': 'رمز OTP يجب أن يكون 6 أرقام',
    'string.pattern.base': 'رمز OTP يجب أن يحتوي على أرقام فقط',
    'any.required': 'رمز التحقق مطلوب',
  }),
  purpose: Joi.string().valid('registration', 'login', 'password_reset').required(),
});

export const requestOtpSchema = Joi.object({
  phone: phoneSchema,
  purpose: Joi.string().valid('registration', 'login', 'password_reset').required(),
});

export const refreshTokenSchema = Joi.object({
  refresh_token: Joi.string().required().messages({
    'any.required': 'رمز التجديد مطلوب',
  }),
});

export const changePasswordSchema = Joi.object({
  current_password: Joi.string().required(),
  new_password: Joi.string().min(8).required().messages({
    'string.min': 'كلمة المرور الجديدة يجب أن تكون 8 أحرف على الأقل',
  }),
});

export const resetPasswordSchema = Joi.object({
  phone: phoneSchema,
  otp_code: Joi.string().length(6).required(),
  new_password: Joi.string().min(8).required(),
});
