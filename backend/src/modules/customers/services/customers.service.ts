import { randomUUID } from 'crypto';
import { db } from '../../../core/database';
import { getOffset } from '../../../shared/utils/pagination';
import { NotFoundError } from '../../../shared/errors/AppError';

export class CustomersService {
  async getAll(filters: { search?: string; page?: number; limit?: number }) {
    const page = filters.page || 1;
    const limit = filters.limit || 20;
    const offset = getOffset(page, limit);

    const params: unknown[] = [];
    let where = "WHERE u.role = 'customer'";

    if (filters.search) {
      where += ' AND (u.full_name LIKE ? OR u.phone LIKE ?)';
      params.push(`%${filters.search}%`, `%${filters.search}%`);
    }

    const [rows, countRows] = await Promise.all([
      db.query<any[]>(
        `SELECT u.id, u.full_name, u.phone, u.avatar_url, u.status, u.created_at,
                COUNT(sr.id) as total_requests
         FROM users u
         LEFT JOIN service_requests sr ON sr.customer_id = u.id
         ${where}
         GROUP BY u.id
         ORDER BY u.created_at DESC LIMIT ? OFFSET ?`,
        [...params, limit, offset]
      ),
      db.query<any[]>(`SELECT COUNT(*) as total FROM users u ${where}`, params),
    ]);

    return { rows, total: countRows[0].total };
  }

  async getAddresses(userId: string) {
    return db.query<any[]>(
      `SELECT id, label, address, latitude, longitude, is_default, created_at
       FROM saved_addresses WHERE user_id = ? ORDER BY is_default DESC, created_at DESC`,
      [userId]
    );
  }

  async addAddress(userId: string, data: { label: string; address: string; latitude?: number; longitude?: number }) {
    const id = randomUUID();
    await db.query(
      `INSERT INTO saved_addresses (id, user_id, label, address, latitude, longitude, is_default)
       VALUES (?, ?, ?, ?, ?, ?, 0)`,
      [id, userId, data.label, data.address, data.latitude ?? 0, data.longitude ?? 0]
    );
    const [row] = await db.query<any[]>(
      `SELECT id, label, address, latitude, longitude, is_default, created_at FROM saved_addresses WHERE id = ?`,
      [id]
    );
    return row;
  }

  async updateAddress(userId: string, addressId: string, data: { label: string; address: string }) {
    const [existing] = await db.query<any[]>(
      `SELECT id FROM saved_addresses WHERE id = ? AND user_id = ?`,
      [addressId, userId]
    );
    if (!existing) throw new NotFoundError('العنوان غير موجود');
    await db.query(
      `UPDATE saved_addresses SET label = ?, address = ? WHERE id = ?`,
      [data.label, data.address, addressId]
    );
    const [row] = await db.query<any[]>(
      `SELECT id, label, address, latitude, longitude, is_default, created_at FROM saved_addresses WHERE id = ?`,
      [addressId]
    );
    return row;
  }

  async deleteAddress(userId: string, addressId: string) {
    const [existing] = await db.query<any[]>(
      `SELECT id FROM saved_addresses WHERE id = ? AND user_id = ?`,
      [addressId, userId]
    );
    if (!existing) throw new NotFoundError('العنوان غير موجود');
    await db.query(`DELETE FROM saved_addresses WHERE id = ?`, [addressId]);
  }
}
