import { v4 as uuidv4 } from 'uuid';
import { db } from '../../../core/database';
import { redis } from '../../../core/redis';
import { processAndSaveImage } from '../../../core/storage';
import { NotFoundError, ForbiddenError, BadRequestError } from '../../../shared/errors/AppError';
import { TechnicianAvailability } from '../../../shared/types';
import { getOffset } from '../../../shared/utils/pagination';

export class TechniciansService {
  async getProfile(technicianId: string): Promise<object> {
    const cacheKey = `technician_profile:${technicianId}`;
    const cached = await redis.getJSON<object>(cacheKey);
    if (cached) return cached;

    const rows = await db.query<any[]>(
      `SELECT u.id, u.full_name, u.phone, u.email, u.avatar_url, u.status,
              tp.bio, tp.years_experience, tp.availability, tp.verification_status,
              tp.current_latitude, tp.current_longitude, tp.coverage_radius_km,
              tp.rating_average, tp.rating_count, tp.total_jobs, tp.completed_jobs, tp.is_featured
       FROM users u
       JOIN technician_profiles tp ON tp.user_id = u.id
       WHERE u.id = ? LIMIT 1`,
      [technicianId]
    );

    if (!rows[0]) throw new NotFoundError('الفني');

    const profile = rows[0];

    // Get services
    const services = await db.query<any[]>(
      `SELECT ts.*, sc.name_ar, sc.icon_url
       FROM technician_services ts
       JOIN service_categories sc ON ts.category_id = sc.id
       WHERE ts.technician_id = (SELECT id FROM technician_profiles WHERE user_id = ?)`,
      [technicianId]
    );
    profile.services = services;

    // Get portfolio
    const portfolio = await db.query<any[]>(
      `SELECT * FROM technician_portfolio
       WHERE technician_id = (SELECT id FROM technician_profiles WHERE user_id = ?)
       ORDER BY created_at DESC`,
      [technicianId]
    );
    profile.portfolio = portfolio;

    await redis.setJSON(cacheKey, profile, 300);
    return profile;
  }

  async updateProfile(userId: string, data: {
    fullName?: string;
    bio?: string;
    yearsExperience?: number;
    coverageRadiusKm?: number;
    avatar?: Express.Multer.File;
  }): Promise<void> {
    if (data.avatar) {
      const avatarUrl = await processAndSaveImage(data.avatar.buffer, 'avatars', 400);
      await db.query('UPDATE users SET avatar_url = ? WHERE id = ?', [avatarUrl, userId]);
    }

    if (data.fullName) {
      await db.query('UPDATE users SET full_name = ? WHERE id = ?', [data.fullName, userId]);
    }

    if (data.bio !== undefined || data.yearsExperience !== undefined || data.coverageRadiusKm !== undefined) {
      const updates: string[] = [];
      const params: unknown[] = [];

      if (data.bio !== undefined) { updates.push('bio = ?'); params.push(data.bio); }
      if (data.yearsExperience !== undefined) { updates.push('years_experience = ?'); params.push(data.yearsExperience); }
      if (data.coverageRadiusKm !== undefined) { updates.push('coverage_radius_km = ?'); params.push(data.coverageRadiusKm); }

      params.push(userId);
      await db.query(
        `UPDATE technician_profiles SET ${updates.join(', ')} WHERE user_id = ?`,
        params
      );
    }

    await redis.del(`technician_profile:${userId}`);
  }

  async updateAvailability(userId: string, availability: TechnicianAvailability): Promise<void> {
    await db.query(
      'UPDATE technician_profiles SET availability = ? WHERE user_id = ?',
      [availability, userId]
    );
    await redis.hSet('technician_availability', userId, availability);
    await redis.del(`technician_profile:${userId}`);
  }

  async updateLocation(userId: string, latitude: number, longitude: number): Promise<void> {
    await db.query(
      'UPDATE technician_profiles SET current_latitude = ?, current_longitude = ? WHERE user_id = ?',
      [latitude, longitude, userId]
    );

    // Store in Redis for real-time queries
    await redis.hSet(`technician_location:${userId}`, 'lat', String(latitude));
    await redis.hSet(`technician_location:${userId}`, 'lng', String(longitude));
    await redis.expire(`technician_location:${userId}`, 3600);
  }

  async uploadIdDocument(userId: string, frontFile: Express.Multer.File, backFile?: Express.Multer.File): Promise<void> {
    const frontUrl = await processAndSaveImage(frontFile.buffer, 'documents');
    let backUrl: string | undefined;

    if (backFile) {
      backUrl = await processAndSaveImage(backFile.buffer, 'documents');
    }

    await db.query(
      'UPDATE technician_profiles SET id_document_url = ?, id_document_back_url = ? WHERE user_id = ?',
      [frontUrl, backUrl || null, userId]
    );
  }

  async getDocuments(userId: string): Promise<object[]> {
    const rows = await db.query<any[]>(
      'SELECT id_document_url, id_document_back_url, verification_status FROM technician_profiles WHERE user_id = ? LIMIT 1',
      [userId]
    );
    if (!rows[0]) throw new NotFoundError('ملف الفني');
    const { id_document_url, id_document_back_url, verification_status } = rows[0];
    const docs: object[] = [];
    if (id_document_url) {
      docs.push({ type: 'national_id', url: id_document_url, status: verification_status ?? 'pending' });
    }
    if (id_document_back_url) {
      docs.push({ type: 'national_id_back', url: id_document_back_url, status: verification_status ?? 'pending' });
    }
    return docs;
  }

  async getServices(userId: string): Promise<object[]> {
    const techProfile = await db.query<any[]>(
      'SELECT id FROM technician_profiles WHERE user_id = ?', [userId]
    );
    if (!techProfile[0]) throw new NotFoundError('ملف الفني');
    return db.query<any[]>(
      `SELECT ts.id, ts.category_id, ts.price_from, ts.price_to, sc.name_ar, sc.icon_url
       FROM technician_services ts
       JOIN service_categories sc ON ts.category_id = sc.id
       WHERE ts.technician_id = ?`,
      [techProfile[0].id]
    );
  }

  async addService(userId: string, categoryId: string, priceFrom?: number, priceTo?: number): Promise<void> {
    const techProfile = await db.query<any[]>(
      'SELECT id FROM technician_profiles WHERE user_id = ?', [userId]
    );
    if (!techProfile[0]) throw new NotFoundError('ملف الفني');

    await db.query(
      `INSERT IGNORE INTO technician_services (id, technician_id, category_id, price_from, price_to)
       VALUES (?, ?, ?, ?, ?)`,
      [uuidv4(), techProfile[0].id, categoryId, priceFrom || null, priceTo || null]
    );
    await redis.del(`technician_profile:${userId}`);
  }

  async removeService(userId: string, categoryId: string): Promise<void> {
    const techProfile = await db.query<any[]>(
      'SELECT id FROM technician_profiles WHERE user_id = ?', [userId]
    );
    if (!techProfile[0]) throw new NotFoundError('ملف الفني');

    await db.query(
      'DELETE FROM technician_services WHERE technician_id = ? AND category_id = ?',
      [techProfile[0].id, categoryId]
    );
    await redis.del(`technician_profile:${userId}`);
  }

  async getPortfolio(userId: string): Promise<object[]> {
    const techProfile = await db.query<any[]>(
      'SELECT id FROM technician_profiles WHERE user_id = ?', [userId]
    );
    if (!techProfile[0]) throw new NotFoundError('ملف الفني');
    return db.query<any[]>(
      'SELECT id, image_url, caption, created_at FROM technician_portfolio WHERE technician_id = ? ORDER BY created_at DESC',
      [techProfile[0].id]
    );
  }

  async addPortfolioImage(userId: string, imageFile: Express.Multer.File, caption?: string): Promise<object> {
    const techProfile = await db.query<any[]>(
      'SELECT id FROM technician_profiles WHERE user_id = ?', [userId]
    );
    if (!techProfile[0]) throw new NotFoundError('ملف الفني');

    const imageUrl = await processAndSaveImage(imageFile.buffer, 'images');
    const id = uuidv4();

    await db.query(
      'INSERT INTO technician_portfolio (id, technician_id, image_url, caption) VALUES (?, ?, ?, ?)',
      [id, techProfile[0].id, imageUrl, caption || null]
    );

    await redis.del(`technician_profile:${userId}`);
    return { id, image_url: imageUrl, caption: caption || null };
  }

  async deletePortfolioImage(userId: string, imageId: string): Promise<void> {
    const techProfile = await db.query<any[]>(
      'SELECT id FROM technician_profiles WHERE user_id = ?', [userId]
    );
    if (!techProfile[0]) throw new NotFoundError('ملف الفني');

    const rows = await db.query<any[]>(
      'SELECT id FROM technician_portfolio WHERE id = ? AND technician_id = ?',
      [imageId, techProfile[0].id]
    );
    if (!rows[0]) throw new NotFoundError('الصورة');

    await db.query('DELETE FROM technician_portfolio WHERE id = ?', [imageId]);
    await redis.del(`technician_profile:${userId}`);
  }

  async getAll(filters: {
    categoryId?: string;
    availability?: string;
    verificationStatus?: string;
    search?: string;
    page?: number;
    limit?: number;
  }): Promise<{ rows: any[]; total: number }> {
    const page = filters.page || 1;
    const limit = filters.limit || 20;
    const offset = getOffset(page, limit);

    const conditions: string[] = [];
    const params: unknown[] = [];

    if (filters.categoryId) {
      conditions.push('EXISTS (SELECT 1 FROM technician_services ts WHERE ts.technician_id = tp.id AND ts.category_id = ?)');
      params.push(filters.categoryId);
    }
    if (filters.availability) { conditions.push('tp.availability = ?'); params.push(filters.availability); }
    if (filters.verificationStatus) { conditions.push('tp.verification_status = ?'); params.push(filters.verificationStatus); }
    if (filters.search) { conditions.push('u.full_name LIKE ?'); params.push(`%${filters.search}%`); }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

    const [rows, countRows] = await Promise.all([
      db.query<any[]>(
        `SELECT u.id, u.full_name, u.phone, u.avatar_url, u.status,
                tp.rating_average, tp.rating_count, tp.completed_jobs,
                tp.availability, tp.verification_status, tp.years_experience
         FROM users u
         JOIN technician_profiles tp ON tp.user_id = u.id
         ${where} ORDER BY tp.rating_average DESC LIMIT ? OFFSET ?`,
        [...params, limit, offset]
      ),
      db.query<any[]>(`SELECT COUNT(*) as total FROM users u JOIN technician_profiles tp ON tp.user_id = u.id ${where}`, params),
    ]);

    return { rows, total: countRows[0].total };
  }

  async approveTechnician(technicianId: string, adminId: string): Promise<void> {
    await db.query(
      "UPDATE technician_profiles SET verification_status = 'approved' WHERE user_id = ?",
      [technicianId]
    );
    await db.query(
      "UPDATE users SET status = 'active' WHERE id = ?",
      [technicianId]
    );
    await this.logAdminAction(adminId, 'APPROVE_TECHNICIAN', technicianId);
    await redis.del(`technician_profile:${technicianId}`);
  }

  async rejectTechnician(technicianId: string, adminId: string, reason: string): Promise<void> {
    await db.query(
      "UPDATE technician_profiles SET verification_status = 'rejected', rejection_reason = ? WHERE user_id = ?",
      [reason, technicianId]
    );
    await this.logAdminAction(adminId, 'REJECT_TECHNICIAN', technicianId);
    await redis.del(`technician_profile:${technicianId}`);
  }

  private async logAdminAction(adminId: string, action: string, entityId: string): Promise<void> {
    await db.query(
      'INSERT INTO admin_logs (id, admin_id, action, entity_type, entity_id) VALUES (?, ?, ?, ?, ?)',
      [uuidv4(), adminId, action, 'technician', entityId]
    );
  }
}
