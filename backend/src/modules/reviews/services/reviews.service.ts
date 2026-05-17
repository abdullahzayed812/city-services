import { v4 as uuidv4 } from 'uuid';
import { db } from '../../../core/database';
import { NotFoundError, ConflictError, BadRequestError, ForbiddenError } from '../../../shared/errors/AppError';
import { eventBus, AppEvents } from '../../../core/events/EventBus';
import { getOffset } from '../../../shared/utils/pagination';

export class ReviewsService {
  async submitReview(customerId: string, data: {
    requestId: string;
    rating: number;
    comment?: string;
  }): Promise<object> {
    // Verify request belongs to customer and is completed
    const requests = await db.query<any[]>(
      'SELECT * FROM service_requests WHERE id = ? AND customer_id = ? AND status = ? LIMIT 1',
      [data.requestId, customerId, 'completed']
    );

    if (!requests[0]) {
      throw new NotFoundError('الطلب أو غير مكتمل');
    }

    const request = requests[0];

    // Check if already reviewed
    const existingReview = await db.query<any[]>(
      'SELECT id FROM reviews WHERE request_id = ? LIMIT 1',
      [data.requestId]
    );
    if (existingReview[0]) {
      throw new ConflictError('لقد قمت بالتقييم مسبقاً');
    }

    if (data.rating < 1 || data.rating > 5) {
      throw new BadRequestError('التقييم يجب أن يكون بين 1 و 5');
    }

    const reviewId = uuidv4();
    await db.query(
      `INSERT INTO reviews (id, request_id, customer_id, technician_id, rating, comment)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [reviewId, data.requestId, customerId, request.accepted_technician_id, data.rating, data.comment || null]
    );

    // Update technician rating average
    await db.query(
      `UPDATE technician_profiles
       SET rating_average = (
         SELECT AVG(rating) FROM reviews WHERE technician_id = ?
       ),
       rating_count = (
         SELECT COUNT(*) FROM reviews WHERE technician_id = ?
       )
       WHERE user_id = ?`,
      [request.accepted_technician_id, request.accepted_technician_id, request.accepted_technician_id]
    );

    eventBus.emit(AppEvents.REVIEW_SUBMITTED, { reviewId, technicianId: request.accepted_technician_id, rating: data.rating });

    return { id: reviewId, rating: data.rating, comment: data.comment };
  }

  async getTechnicianReviews(technicianId: string, page: number = 1, limit: number = 20): Promise<{ rows: any[]; total: number }> {
    const offset = getOffset(page, limit);
    const [rows, countRows] = await Promise.all([
      db.query<any[]>(
        `SELECT r.*, u.full_name as customer_name, u.avatar_url as customer_avatar
         FROM reviews r
         JOIN users u ON r.customer_id = u.id
         WHERE r.technician_id = ?
         ORDER BY r.created_at DESC LIMIT ? OFFSET ?`,
        [technicianId, limit, offset]
      ),
      db.query<any[]>('SELECT COUNT(*) as total FROM reviews WHERE technician_id = ?', [technicianId]),
    ]);
    return { rows, total: countRows[0].total };
  }

  async reportReview(reviewId: string, reporterId: string, reason: string): Promise<void> {
    const reviews = await db.query<any[]>('SELECT id FROM reviews WHERE id = ? LIMIT 1', [reviewId]);
    if (!reviews[0]) throw new NotFoundError('التقييم');

    await db.query(
      `INSERT INTO reports (id, reporter_id, review_id, reason, description)
       VALUES (?, ?, ?, ?, ?)`,
      [uuidv4(), reporterId, reviewId, reason, null]
    );

    await db.query('UPDATE reviews SET is_reported = 1 WHERE id = ?', [reviewId]);
  }
}
