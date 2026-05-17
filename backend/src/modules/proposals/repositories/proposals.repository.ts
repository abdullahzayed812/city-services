import { v4 as uuidv4 } from 'uuid';
import { db } from '../../../core/database';

export class ProposalsRepository {
  async create(data: {
    requestId: string;
    technicianId: string;
    proposedPrice: number;
    estimatedDurationMinutes?: number;
    message?: string;
    isCounterOffer?: boolean;
    parentProposalId?: string;
  }): Promise<string> {
    const id = uuidv4();
    await db.query(
      `INSERT INTO request_proposals
        (id, request_id, technician_id, proposed_price, estimated_duration_minutes,
         message, is_counter_offer, parent_proposal_id)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id, data.requestId, data.technicianId, data.proposedPrice,
        data.estimatedDurationMinutes || null, data.message || null,
        data.isCounterOffer ? 1 : 0, data.parentProposalId || null,
      ]
    );
    return id;
  }

  async findById(id: string): Promise<any> {
    const rows = await db.query<any[]>(
      `SELECT rp.*, u.full_name as technician_name, u.avatar_url as technician_avatar,
              tp.rating_average, tp.completed_jobs, tp.verification_status
       FROM request_proposals rp
       JOIN users u ON rp.technician_id = u.id
       JOIN technician_profiles tp ON tp.user_id = u.id
       WHERE rp.id = ? LIMIT 1`,
      [id]
    );
    return rows[0] || null;
  }

  async findByRequest(requestId: string): Promise<any[]> {
    return db.query<any[]>(
      `SELECT rp.*, u.full_name as technician_name, u.avatar_url as technician_avatar,
              u.phone as technician_phone,
              tp.rating_average, tp.completed_jobs, tp.years_experience, tp.verification_status
       FROM request_proposals rp
       JOIN users u ON rp.technician_id = u.id
       JOIN technician_profiles tp ON tp.user_id = u.id
       WHERE rp.request_id = ? AND rp.is_counter_offer = 0
       ORDER BY rp.created_at DESC`,
      [requestId]
    );
  }

  async findByTechnician(technicianId: string, page: number = 1, limit: number = 20): Promise<{ rows: any[]; total: number }> {
    const offset = (page - 1) * limit;
    const [rows, countRows] = await Promise.all([
      db.query<any[]>(
        `SELECT rp.*, sr.title as request_title, sr.address as request_address,
                sc.name_ar as category_name
         FROM request_proposals rp
         JOIN service_requests sr ON rp.request_id = sr.id
         JOIN service_categories sc ON sr.category_id = sc.id
         WHERE rp.technician_id = ?
         ORDER BY rp.created_at DESC LIMIT ? OFFSET ?`,
        [technicianId, limit, offset]
      ),
      db.query<any[]>('SELECT COUNT(*) as total FROM request_proposals WHERE technician_id = ?', [technicianId]),
    ]);
    return { rows, total: countRows[0].total };
  }

  async updateStatus(id: string, status: string): Promise<void> {
    await db.query('UPDATE request_proposals SET status = ? WHERE id = ?', [status, id]);
  }

  async existsByRequestAndTechnician(requestId: string, technicianId: string): Promise<boolean> {
    const rows = await db.query<any[]>(
      'SELECT id FROM request_proposals WHERE request_id = ? AND technician_id = ? LIMIT 1',
      [requestId, technicianId]
    );
    return rows.length > 0;
  }
}
