import { v4 as uuidv4 } from 'uuid';
import { db } from '../../../core/database';
import { redis } from '../../../core/redis';
import { processAndSaveImage } from '../../../core/storage';
import { NotFoundError } from '../../../shared/errors/AppError';

export class ServicesService {
  async getCategories(): Promise<object[]> {
    const cacheKey = 'service_categories';
    const cached = await redis.getJSON<object[]>(cacheKey);
    if (cached) return cached;

    const categories = await db.query<any[]>(
      `SELECT * FROM service_categories WHERE is_active = 1 AND parent_id IS NULL
       ORDER BY sort_order ASC`
    );

    for (const cat of categories) {
      cat.subcategories = await db.query<any[]>(
        'SELECT * FROM service_categories WHERE parent_id = ? AND is_active = 1 ORDER BY sort_order ASC',
        [cat.id]
      );
    }

    await redis.setJSON(cacheKey, categories, 3600);
    return categories;
  }

  async getCategoryById(id: string): Promise<object> {
    const rows = await db.query<any[]>(
      'SELECT * FROM service_categories WHERE id = ? LIMIT 1', [id]
    );
    if (!rows[0]) throw new NotFoundError('التصنيف');
    return rows[0];
  }

  async createCategory(data: {
    nameAr: string;
    nameEn?: string;
    descriptionAr?: string;
    descriptionEn?: string;
    basePrice?: number;
    sortOrder?: number;
    parentId?: string;
    iconFile?: Express.Multer.File;
  }): Promise<object> {
    let iconUrl: string | undefined;
    if (data.iconFile) {
      iconUrl = await processAndSaveImage(data.iconFile.buffer, 'images', 200);
    }

    const id = uuidv4();
    await db.query(
      `INSERT INTO service_categories (id, name_ar, name_en, description_ar, description_en,
        icon_url, base_price, sort_order, parent_id)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, data.nameAr, data.nameEn || null, data.descriptionAr || null, data.descriptionEn || null,
       iconUrl || null, data.basePrice || null, data.sortOrder || 0, data.parentId || null]
    );

    await redis.del('service_categories');
    return this.getCategoryById(id);
  }

  async updateCategory(id: string, data: Partial<{
    nameAr: string;
    nameEn: string;
    descriptionAr: string;
    basePrice: number;
    sortOrder: number;
    isActive: boolean;
    iconFile: Express.Multer.File;
  }>): Promise<void> {
    const updates: string[] = [];
    const params: unknown[] = [];

    if (data.nameAr) { updates.push('name_ar = ?'); params.push(data.nameAr); }
    if (data.nameEn) { updates.push('name_en = ?'); params.push(data.nameEn); }
    if (data.descriptionAr !== undefined) { updates.push('description_ar = ?'); params.push(data.descriptionAr); }
    if (data.basePrice !== undefined) { updates.push('base_price = ?'); params.push(data.basePrice); }
    if (data.sortOrder !== undefined) { updates.push('sort_order = ?'); params.push(data.sortOrder); }
    if (data.isActive !== undefined) { updates.push('is_active = ?'); params.push(data.isActive ? 1 : 0); }

    if (data.iconFile) {
      const iconUrl = await processAndSaveImage(data.iconFile.buffer, 'images', 200);
      updates.push('icon_url = ?');
      params.push(iconUrl);
    }

    if (!updates.length) return;

    params.push(id);
    await db.query(`UPDATE service_categories SET ${updates.join(', ')} WHERE id = ?`, params);
    await redis.del('service_categories');
  }

  async deleteCategory(id: string): Promise<void> {
    await db.query('UPDATE service_categories SET is_active = 0 WHERE id = ?', [id]);
    await redis.del('service_categories');
  }
}
