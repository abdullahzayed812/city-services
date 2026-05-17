import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../../../core/database';
import { sendSuccess, sendCreated } from '../../../shared/utils/response';
import { asyncHandler } from '../../../shared/middlewares/error.middleware';
import { NotFoundError } from '../../../shared/errors/AppError';

export class CategoriesController {
  getAll = asyncHandler(async (_req: Request, res: Response) => {
    const rows = await db.query<any[]>(
      `SELECT sc.id, sc.name_ar AS name, sc.icon_url AS icon,
              sc.description_ar AS description, sc.is_active,
              COUNT(DISTINCT ts.technician_id) AS technician_count
       FROM service_categories sc
       LEFT JOIN technician_services ts ON ts.category_id = sc.id
       WHERE sc.parent_id IS NULL
       GROUP BY sc.id
       ORDER BY sc.sort_order ASC, sc.name_ar ASC`
    );
    sendSuccess(res, rows);
  });

  create = asyncHandler(async (req: Request, res: Response) => {
    const { name, icon, description } = req.body;
    const id = uuidv4();
    await db.query(
      `INSERT INTO service_categories (id, name_ar, icon_url, description_ar) VALUES (?, ?, ?, ?)`,
      [id, name, icon || null, description || null]
    );
    sendCreated(res, { id, name, icon, description, is_active: true, technician_count: 0 }, 'تم إضافة الفئة بنجاح');
  });

  update = asyncHandler(async (req: Request, res: Response) => {
    const { name, icon, description, is_active } = req.body;
    const existing = await db.query<any[]>(
      'SELECT id FROM service_categories WHERE id = ? LIMIT 1',
      [req.params.id]
    );
    if (!existing[0]) throw new NotFoundError('الفئة');

    const updates: string[] = [];
    const params: unknown[] = [];
    if (name !== undefined)       { updates.push('name_ar = ?');       params.push(name); }
    if (icon !== undefined)       { updates.push('icon_url = ?');       params.push(icon); }
    if (description !== undefined){ updates.push('description_ar = ?'); params.push(description); }
    if (is_active !== undefined)  { updates.push('is_active = ?');      params.push(is_active); }

    if (updates.length) {
      await db.query(
        `UPDATE service_categories SET ${updates.join(', ')} WHERE id = ?`,
        [...params, req.params.id]
      );
    }
    sendSuccess(res, null, 'تم تحديث الفئة بنجاح');
  });

  remove = asyncHandler(async (req: Request, res: Response) => {
    await db.query(
      'UPDATE service_categories SET is_active = 0 WHERE id = ?',
      [req.params.id]
    );
    sendSuccess(res, null, 'تم حذف الفئة بنجاح');
  });
}
