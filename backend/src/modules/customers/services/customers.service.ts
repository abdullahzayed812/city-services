import { db } from '../../../core/database';
import { getOffset } from '../../../shared/utils/pagination';

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
}
