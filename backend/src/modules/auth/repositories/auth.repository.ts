import { v4 as uuidv4 } from 'uuid';
import { db } from '../../../core/database';
import { UserRole, UserStatus } from '../../../shared/types';

interface CreateUserParams {
  phone: string;
  email?: string;
  passwordHash: string;
  fullName: string;
  role: UserRole;
}

interface OtpRecord {
  id: string;
  phone: string;
  code: string;
  purpose: string;
  attempts: number;
  expires_at: Date;
  used_at: Date | null;
}

interface UserRecord {
  id: string;
  phone: string;
  email: string | null;
  password_hash: string;
  full_name: string;
  role: UserRole;
  status: UserStatus;
  phone_verified: number;
  fcm_token: string | null;
  avatar_url: string | null;
  created_at: Date;
}

export class AuthRepository {
  async createUser(params: CreateUserParams): Promise<string> {
    const id = uuidv4();
    await db.query(
      `INSERT INTO users (id, phone, email, password_hash, full_name, role, status)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [id, params.phone, params.email, params.passwordHash, params.fullName, params.role, UserStatus.PENDING_VERIFICATION]
    );
    return id;
  }

  async findUserByPhone(phone: string): Promise<UserRecord | null> {
    const rows = await db.query<UserRecord[]>(
      'SELECT * FROM users WHERE phone = ? LIMIT 1',
      [phone]
    );
    return rows[0] || null;
  }

  async findUserById(id: string): Promise<UserRecord | null> {
    const rows = await db.query<UserRecord[]>(
      'SELECT * FROM users WHERE id = ? LIMIT 1',
      [id]
    );
    return rows[0] || null;
  }

  async verifyPhone(phone: string): Promise<void> {
    await db.query(
      'UPDATE users SET phone_verified = 1, status = ? WHERE phone = ?',
      [UserStatus.ACTIVE, phone]
    );
  }

  async updateStatus(userId: string, status: UserStatus): Promise<void> {
    await db.query('UPDATE users SET status = ? WHERE id = ?', [status, userId]);
  }

  async updatePassword(userId: string, passwordHash: string): Promise<void> {
    await db.query('UPDATE users SET password_hash = ? WHERE id = ?', [passwordHash, userId]);
  }

  async updateFcmToken(userId: string, fcmToken: string): Promise<void> {
    await db.query('UPDATE users SET fcm_token = ? WHERE id = ?', [fcmToken, userId]);
  }

  async updateLastLogin(userId: string): Promise<void> {
    await db.query('UPDATE users SET last_login_at = NOW() WHERE id = ?', [userId]);
  }

  async createOtp(phone: string, code: string, purpose: string, expiresAt: Date): Promise<void> {
    await db.query(
      `INSERT INTO otp_codes (id, phone, code, purpose, expires_at) VALUES (?, ?, ?, ?, ?)`,
      [uuidv4(), phone, code, purpose, expiresAt]
    );
  }

  async findValidOtp(phone: string, purpose: string): Promise<OtpRecord | null> {
    const rows = await db.query<OtpRecord[]>(
      `SELECT * FROM otp_codes
       WHERE phone = ? AND purpose = ? AND used_at IS NULL AND expires_at > NOW()
       ORDER BY created_at DESC LIMIT 1`,
      [phone, purpose]
    );
    return rows[0] || null;
  }

  async markOtpUsed(id: string): Promise<void> {
    await db.query('UPDATE otp_codes SET used_at = NOW() WHERE id = ?', [id]);
  }

  async incrementOtpAttempts(id: string): Promise<void> {
    await db.query('UPDATE otp_codes SET attempts = attempts + 1 WHERE id = ?', [id]);
  }

  async saveRefreshToken(userId: string, tokenHash: string, expiresAt: Date): Promise<void> {
    await db.query(
      `INSERT INTO refresh_tokens (id, user_id, token_hash, expires_at) VALUES (?, ?, ?, ?)`,
      [uuidv4(), userId, tokenHash, expiresAt]
    );
  }

  async findRefreshToken(tokenHash: string): Promise<{ user_id: string; expires_at: Date; revoked_at: Date | null } | null> {
    const rows = await db.query<{ user_id: string; expires_at: Date; revoked_at: Date | null }[]>(
      'SELECT * FROM refresh_tokens WHERE token_hash = ? LIMIT 1',
      [tokenHash]
    );
    return rows[0] || null;
  }

  async revokeRefreshToken(tokenHash: string): Promise<void> {
    await db.query('UPDATE refresh_tokens SET revoked_at = NOW() WHERE token_hash = ?', [tokenHash]);
  }

  async revokeAllUserTokens(userId: string): Promise<void> {
    await db.query(
      'UPDATE refresh_tokens SET revoked_at = NOW() WHERE user_id = ? AND revoked_at IS NULL',
      [userId]
    );
  }
}
