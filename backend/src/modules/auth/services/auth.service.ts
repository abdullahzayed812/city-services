import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { v4 as uuidv4 } from 'uuid';
import { config } from '../../../config';
import { AuthRepository } from '../repositories/auth.repository';
import { redis } from '../../../core/redis';
import { eventBus, AppEvents } from '../../../core/events/EventBus';
import { generateOTP } from '../../../shared/utils/otp';
import {
  ConflictError, UnauthorizedError, BadRequestError, ForbiddenError,
} from '../../../shared/errors/AppError';
import { UserRole, JwtPayload } from '../../../shared/types';

export class AuthService {
  private readonly repo: AuthRepository;

  constructor() {
    this.repo = new AuthRepository();
  }

  async registerCustomer(data: {
    phone: string;
    fullName: string;
    password: string;
    email?: string;
  }): Promise<{ message: string }> {
    const existing = await this.repo.findUserByPhone(data.phone);
    if (existing) {
      throw new ConflictError('رقم الهاتف مسجل مسبقاً');
    }

    const passwordHash = await bcrypt.hash(data.password, 12);
    const userId = await this.repo.createUser({
      phone: data.phone,
      email: data.email,
      passwordHash,
      fullName: data.fullName,
      role: UserRole.CUSTOMER,
    });

    await this.createWallet(userId);
    await this.createCustomerProfile(userId);
    await this.sendOtp(data.phone, 'registration');

    eventBus.emit(AppEvents.USER_REGISTERED, { userId, phone: data.phone, role: UserRole.CUSTOMER });

    return { message: 'تم إنشاء الحساب بنجاح. يرجى تأكيد رقم هاتفك.' };
  }

  async registerTechnician(data: {
    phone: string;
    fullName: string;
    password: string;
    email?: string;
    bio?: string;
    yearsExperience?: number;
  }): Promise<{ message: string }> {
    const existing = await this.repo.findUserByPhone(data.phone);
    if (existing) {
      throw new ConflictError('رقم الهاتف مسجل مسبقاً');
    }

    const passwordHash = await bcrypt.hash(data.password, 12);
    const userId = await this.repo.createUser({
      phone: data.phone,
      email: data.email,
      passwordHash,
      fullName: data.fullName,
      role: UserRole.TECHNICIAN,
    });

    await this.createWallet(userId);
    await this.createTechnicianProfile(userId, data.bio, data.yearsExperience);
    await this.sendOtp(data.phone, 'registration');

    eventBus.emit(AppEvents.USER_REGISTERED, { userId, phone: data.phone, role: UserRole.TECHNICIAN });

    return { message: 'تم إنشاء حساب الفني بنجاح. يرجى تأكيد رقم هاتفك وانتظار موافقة الإدارة.' };
  }

  async login(data: { phone: string; password: string; fcmToken?: string }): Promise<{
    accessToken: string;
    refreshToken: string;
    user: object;
  }> {
    const user = await this.repo.findUserByPhone(data.phone);
    if (!user) {
      throw new UnauthorizedError('رقم الهاتف أو كلمة المرور غير صحيحة');
    }

    const passwordMatch = await bcrypt.compare(data.password, user.password_hash);
    if (!passwordMatch) {
      throw new UnauthorizedError('رقم الهاتف أو كلمة المرور غير صحيحة');
    }

    if (!user.phone_verified) {
      throw new ForbiddenError('يجب تأكيد رقم هاتفك أولاً');
    }

    if (user.status === 'suspended') {
      throw new ForbiddenError('حسابك موقوف. يرجى التواصل مع الدعم الفني');
    }

    if (data.fcmToken) {
      await this.repo.updateFcmToken(user.id, data.fcmToken);
    }

    await this.repo.updateLastLogin(user.id);

    const tokens = await this.generateTokens(user.id, user.role as UserRole);

    eventBus.emit(AppEvents.USER_LOGIN, { userId: user.id, role: user.role });

    return {
      ...tokens,
      user: {
        id: user.id,
        phone: user.phone,
        email: user.email,
        full_name: user.full_name,
        role: user.role,
        status: user.status,
        avatar_url: user.avatar_url,
      },
    };
  }

  async verifyOtp(data: { phone: string; code: string; purpose: string }): Promise<{ message: string }> {
    const otpRecord = await this.repo.findValidOtp(data.phone, data.purpose);

    if (!otpRecord) {
      throw new BadRequestError('رمز التحقق غير صحيح أو منتهي الصلاحية');
    }

    if (otpRecord.attempts >= 5) {
      throw new BadRequestError('تم تجاوز الحد الأقصى لمحاولات التحقق');
    }

    if (otpRecord.code !== data.code) {
      await this.repo.incrementOtpAttempts(otpRecord.id);
      throw new BadRequestError('رمز التحقق غير صحيح');
    }

    await this.repo.markOtpUsed(otpRecord.id);

    if (data.purpose === 'registration') {
      await this.repo.verifyPhone(data.phone);
    }

    return { message: 'تم التحقق بنجاح' };
  }

  async requestOtp(data: { phone: string; purpose: string }): Promise<{ message: string }> {
    const rateLimitKey = `otp_rate:${data.phone}:${data.purpose}`;
    const attempts = await redis.get(rateLimitKey);

    if (attempts && parseInt(attempts) >= 3) {
      throw new BadRequestError('لقد تجاوزت الحد الأقصى لطلبات OTP. يرجى الانتظار قبل المحاولة مجدداً');
    }

    await this.sendOtp(data.phone, data.purpose);

    const current = attempts ? parseInt(attempts) : 0;
    await redis.set(rateLimitKey, String(current + 1), 3600);

    return { message: 'تم إرسال رمز التحقق' };
  }

  async refreshToken(refreshToken: string): Promise<{ accessToken: string; refreshToken: string }> {
    const tokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');
    const record = await this.repo.findRefreshToken(tokenHash);

    if (!record || record.revoked_at || new Date(record.expires_at) < new Date()) {
      throw new UnauthorizedError('رمز التجديد غير صالح أو منتهي الصلاحية');
    }

    const user = await this.repo.findUserById(record.user_id);
    if (!user) throw new UnauthorizedError();

    await this.repo.revokeRefreshToken(tokenHash);
    return this.generateTokens(user.id, user.role as UserRole);
  }

  async logout(userId: string, refreshToken?: string): Promise<void> {
    if (refreshToken) {
      const tokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');
      await this.repo.revokeRefreshToken(tokenHash);
    } else {
      await this.repo.revokeAllUserTokens(userId);
    }
  }

  async resetPassword(data: { phone: string; otpCode: string; newPassword: string }): Promise<void> {
    const otpRecord = await this.repo.findValidOtp(data.phone, 'password_reset');

    if (!otpRecord || otpRecord.code !== data.otpCode) {
      throw new BadRequestError('رمز التحقق غير صحيح أو منتهي الصلاحية');
    }

    await this.repo.markOtpUsed(otpRecord.id);

    const user = await this.repo.findUserByPhone(data.phone);
    if (!user) throw new BadRequestError('المستخدم غير موجود');

    const passwordHash = await bcrypt.hash(data.newPassword, 12);
    await this.repo.updatePassword(user.id, passwordHash);
    await this.repo.revokeAllUserTokens(user.id);
  }

  private async generateTokens(userId: string, role: UserRole): Promise<{
    accessToken: string;
    refreshToken: string;
  }> {
    const payload: JwtPayload = { userId, role };

    const accessToken = jwt.sign(payload, config.jwt.secret, {
      expiresIn: config.jwt.expiresIn,
    } as jwt.SignOptions);

    const refreshToken = crypto.randomBytes(40).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    await this.repo.saveRefreshToken(userId, tokenHash, expiresAt);

    return { accessToken, refreshToken };
  }

  private async sendOtp(phone: string, purpose: string): Promise<void> {
    const code = generateOTP(6);
    const expiresAt = new Date(Date.now() + config.otp.expiryMinutes * 60 * 1000);

    await this.repo.createOtp(phone, code, purpose, expiresAt);

    // In production: integrate Twilio SMS
    // For dev: log the OTP
    console.log(`[OTP DEV] ${phone} - ${purpose}: ${code}`);
  }

  private async createWallet(userId: string): Promise<void> {
    await db.query(
      'INSERT INTO wallets (id, user_id, balance) VALUES (?, ?, 0)',
      [uuidv4(), userId]
    );
  }

  private async createCustomerProfile(userId: string): Promise<void> {
    await db.query(
      'INSERT INTO customer_profiles (id, user_id) VALUES (?, ?)',
      [uuidv4(), userId]
    );
  }

  private async createTechnicianProfile(userId: string, bio?: string, yearsExperience?: number): Promise<void> {
    await db.query(
      'INSERT INTO technician_profiles (id, user_id, bio, years_experience) VALUES (?, ?, ?, ?)',
      [uuidv4(), userId, bio || null, yearsExperience || 0]
    );
  }
}

import { db } from '../../../core/database';
