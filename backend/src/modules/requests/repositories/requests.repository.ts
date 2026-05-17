import { v4 as uuidv4 } from 'uuid';
import { db } from '../../../core/database';
import { ServiceRequestStatus, RequestType } from '../../../shared/types';
import { getOffset } from '../../../shared/utils/pagination';

export interface CreateRequestParams {
  customerId: string;
  categoryId: string;
  title: string;
  description: string;
  requestType: RequestType;
  address: string;
  latitude: number;
  longitude: number;
  scheduledAt?: Date;
  budgetFrom?: number;
  budgetTo?: number;
  paymentMethod?: string;
  imageUrls?: string[];
}

export class RequestsRepository {
  async create(params: CreateRequestParams): Promise<string> {
    return db.transaction(async (conn) => {
      const id = uuidv4();
      const expiresAt = new Date(Date.now() + 2 * 60 * 60 * 1000); // 2 hours

      await conn.execute(
        `INSERT INTO service_requests
          (id, customer_id, category_id, title, description, request_type, status, address,
           latitude, longitude, scheduled_at, budget_from, budget_to, payment_method, expires_at)
         VALUES (?, ?, ?, ?, ?, ?, 'pending', ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          id, params.customerId, params.categoryId, params.title, params.description,
          params.requestType, params.address, params.latitude, params.longitude,
          params.scheduledAt || null, params.budgetFrom || null, params.budgetTo || null,
          params.paymentMethod || 'cash', expiresAt,
        ]
      );

      if (params.imageUrls?.length) {
        for (const imageUrl of params.imageUrls) {
          await conn.execute(
            'INSERT INTO request_images (id, request_id, image_url) VALUES (?, ?, ?)',
            [uuidv4(), id, imageUrl]
          );
        }
      }

      await conn.execute(
        'INSERT INTO request_status_history (id, request_id, status) VALUES (?, ?, ?)',
        [uuidv4(), id, 'pending']
      );

      return id;
    });
  }

  async findById(id: string): Promise<any> {
    const rows = await db.query<any[]>(
      `SELECT sr.*, sc.name_ar as category_name, sc.icon_url as category_icon,
              u.full_name as customer_name, u.phone as customer_phone, u.avatar_url as customer_avatar
       FROM service_requests sr
       JOIN service_categories sc ON sr.category_id = sc.id
       JOIN users u ON sr.customer_id = u.id
       WHERE sr.id = ? LIMIT 1`,
      [id]
    );

    if (!rows[0]) return null;

    const request = rows[0];
    const images = await db.query<any[]>(
      'SELECT image_url FROM request_images WHERE request_id = ?',
      [id]
    );
    request.images = images.map((i: any) => i.image_url);

    return request;
  }

  async findByCustomer(customerId: string, status?: string, page: number = 1, limit: number = 20): Promise<{ rows: any[]; total: number }> {
    const offset = getOffset(page, limit);
    let where = 'WHERE sr.customer_id = ?';
    const params: unknown[] = [customerId];

    if (status) {
      where += ' AND sr.status = ?';
      params.push(status);
    }

    const [rows, countRows] = await Promise.all([
      db.query<any[]>(
        `SELECT sr.*, sc.name_ar as category_name, sc.icon_url as category_icon
         FROM service_requests sr
         JOIN service_categories sc ON sr.category_id = sc.id
         ${where} ORDER BY sr.created_at DESC LIMIT ? OFFSET ?`,
        [...params, limit, offset]
      ),
      db.query<any[]>(`SELECT COUNT(*) as total FROM service_requests sr ${where}`, params),
    ]);

    return { rows, total: countRows[0].total };
  }

  async findByTechnician(technicianId: string, status?: string, page: number = 1, limit: number = 20): Promise<{ rows: any[]; total: number }> {
    const offset = getOffset(page, limit);
    let where = 'WHERE sr.accepted_technician_id = ?';
    const params: unknown[] = [technicianId];

    if (status) {
      where += ' AND sr.status = ?';
      params.push(status);
    } else {
      where += " AND sr.status IN ('accepted', 'in_progress', 'completed')";
    }

    const [rows, countRows] = await Promise.all([
      db.query<any[]>(
        `SELECT sr.*, sc.name_ar as category_name, sc.icon_url as category_icon,
                u.full_name as customer_name, u.phone as customer_phone, u.avatar_url as customer_avatar
         FROM service_requests sr
         JOIN service_categories sc ON sr.category_id = sc.id
         JOIN users u ON sr.customer_id = u.id
         ${where} ORDER BY sr.created_at DESC LIMIT ? OFFSET ?`,
        [...params, limit, offset]
      ),
      db.query<any[]>(`SELECT COUNT(*) as total FROM service_requests sr ${where}`, params),
    ]);

    return { rows, total: countRows[0].total };
  }

  async findNearbyPending(latitude: number, longitude: number, radiusKm: number = 10, categoryIds?: string[]): Promise<any[]> {
    let categoryFilter = '';
    const params: unknown[] = [latitude, longitude, longitude, latitude, radiusKm];

    if (categoryIds?.length) {
      categoryFilter = `AND sr.category_id IN (${categoryIds.map(() => '?').join(',')})`;
      params.push(...categoryIds);
    }

    return db.query<any[]>(
      `SELECT sr.*, sc.name_ar as category_name, sc.icon_url as category_icon,
              u.full_name as customer_name, u.avatar_url as customer_avatar,
              (
                6371 * acos(
                  cos(radians(?)) * cos(radians(sr.latitude)) *
                  cos(radians(sr.longitude) - radians(?)) +
                  sin(radians(?)) * sin(radians(sr.latitude))
                )
              ) AS distance_km
       FROM service_requests sr
       JOIN service_categories sc ON sr.category_id = sc.id
       JOIN users u ON sr.customer_id = u.id
       WHERE sr.status = 'pending'
         AND sr.expires_at > NOW()
         ${categoryFilter}
       HAVING distance_km <= ?
       ORDER BY distance_km ASC, sr.created_at DESC
       LIMIT 50`,
      params
    );
  }

  async findAllPending(page: number = 1, limit: number = 50): Promise<{ rows: any[]; total: number }> {
    const offset = getOffset(page, limit);
    const [rows, countRows] = await Promise.all([
      db.query<any[]>(
        `SELECT sr.*, sc.name_ar as category_name, sc.icon_url as category_icon,
                u.full_name as customer_name, u.avatar_url as customer_avatar
         FROM service_requests sr
         JOIN service_categories sc ON sr.category_id = sc.id
         JOIN users u ON sr.customer_id = u.id
         WHERE sr.status = 'pending' AND sr.expires_at > NOW()
         ORDER BY sr.created_at DESC
         LIMIT ? OFFSET ?`,
        [limit, offset]
      ),
      db.query<any[]>(
        `SELECT COUNT(*) as total FROM service_requests sr
         WHERE sr.status = 'pending' AND sr.expires_at > NOW()`
      ),
    ]);
    return { rows, total: countRows[0].total };
  }

  async updateStatus(requestId: string, status: ServiceRequestStatus, changedBy?: string, note?: string): Promise<void> {
    await db.transaction(async (conn) => {
      await conn.execute(
        'UPDATE service_requests SET status = ? WHERE id = ?',
        [status, requestId]
      );
      await conn.execute(
        'INSERT INTO request_status_history (id, request_id, status, changed_by, note) VALUES (?, ?, ?, ?, ?)',
        [uuidv4(), requestId, status, changedBy || null, note || null]
      );
    });
  }

  async acceptProposal(requestId: string, proposalId: string, technicianId: string, finalPrice: number): Promise<void> {
    await db.transaction(async (conn) => {
      await conn.execute(
        `UPDATE service_requests
         SET status = 'accepted', accepted_proposal_id = ?, accepted_technician_id = ?, final_price = ?
         WHERE id = ?`,
        [proposalId, technicianId, finalPrice, requestId]
      );

      await conn.execute(
        'UPDATE request_proposals SET status = ? WHERE id = ?',
        ['accepted', proposalId]
      );

      await conn.execute(
        'UPDATE request_proposals SET status = ? WHERE request_id = ? AND id != ?',
        ['rejected', requestId, proposalId]
      );

      await conn.execute(
        'INSERT INTO request_status_history (id, request_id, status, changed_by) VALUES (?, ?, ?, ?)',
        [uuidv4(), requestId, 'accepted', technicianId]
      );
    });
  }

  async complete(requestId: string): Promise<void> {
    await db.query(
      'UPDATE service_requests SET status = ?, completed_at = NOW() WHERE id = ?',
      ['completed', requestId]
    );
  }

  async cancel(requestId: string, reason: string, cancelledBy: string): Promise<void> {
    await db.query(
      'UPDATE service_requests SET status = ?, cancellation_reason = ?, cancelled_by = ? WHERE id = ?',
      ['cancelled', reason, cancelledBy, requestId]
    );
  }

  async findAll(filters: {
    status?: string;
    categoryId?: string;
    requestType?: string;
    page?: number;
    limit?: number;
    search?: string;
  }): Promise<{ rows: any[]; total: number }> {
    const page = filters.page || 1;
    const limit = filters.limit || 20;
    const offset = getOffset(page, limit);

    const conditions: string[] = [];
    const params: unknown[] = [];

    if (filters.status) { conditions.push('sr.status = ?'); params.push(filters.status); }
    if (filters.categoryId) { conditions.push('sr.category_id = ?'); params.push(filters.categoryId); }
    if (filters.requestType) { conditions.push('sr.request_type = ?'); params.push(filters.requestType); }
    if (filters.search) { conditions.push('(sr.title LIKE ? OR u.full_name LIKE ?)'); params.push(`%${filters.search}%`, `%${filters.search}%`); }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

    const [rows, countRows] = await Promise.all([
      db.query<any[]>(
        `SELECT sr.*, sc.name_ar as category_name, u.full_name as customer_name, u.phone as customer_phone
         FROM service_requests sr
         JOIN service_categories sc ON sr.category_id = sc.id
         JOIN users u ON sr.customer_id = u.id
         ${where} ORDER BY sr.created_at DESC LIMIT ? OFFSET ?`,
        [...params, limit, offset]
      ),
      db.query<any[]>(`SELECT COUNT(*) as total FROM service_requests sr JOIN users u ON sr.customer_id = u.id ${where}`, params),
    ]);

    return { rows, total: countRows[0].total };
  }

  async findStatusHistory(requestId: string): Promise<any[]> {
    return db.query<any[]>(
      `SELECT rsh.*, u.full_name as changed_by_name
       FROM request_status_history rsh
       LEFT JOIN users u ON rsh.changed_by = u.id
       WHERE rsh.request_id = ?
       ORDER BY rsh.created_at ASC`,
      [requestId]
    );
  }

  async expireOldRequests(): Promise<number> {
    const result: any = await db.query(
      'UPDATE service_requests SET status = ? WHERE status = ? AND expires_at < NOW()',
      ['expired', 'pending']
    );
    return result.affectedRows || 0;
  }
}
