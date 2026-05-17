import { v4 as uuidv4 } from 'uuid';
import { db } from '../../../core/database';
import { logger } from '../../../core/logger';

interface NotificationPayload {
  type: string;
  titleAr: string;
  bodyAr: string;
  data?: Record<string, unknown>;
}

interface NearbyTechnicianRequest {
  category_id: string;
  latitude: number;
  longitude: number;
  title: string;
  id: string;
  coverage_radius_km?: number;
}

export class NotificationService {
  async sendToUser(userId: string, payload: NotificationPayload): Promise<void> {
    try {
      const notifId = uuidv4();
      await db.query(
        `INSERT INTO notifications (id, user_id, type, title_ar, body_ar, data)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [notifId, userId, payload.type, payload.titleAr, payload.bodyAr,
         payload.data ? JSON.stringify(payload.data) : null]
      );

      // Get FCM token and send push notification
      const users = await db.query<any[]>('SELECT fcm_token FROM users WHERE id = ?', [userId]);
      if (users[0]?.fcm_token) {
        await this.sendPushNotification(users[0].fcm_token, payload);
      }
    } catch (error) {
      logger.error('Failed to send notification:', error);
    }
  }

  async sendToMultipleUsers(userIds: string[], payload: NotificationPayload): Promise<void> {
    await Promise.allSettled(userIds.map((uid) => this.sendToUser(uid, payload)));
  }

  async notifyNearbyTechnicians(request: NearbyTechnicianRequest): Promise<void> {
    const technicians = await db.query<any[]>(
      `SELECT tp.user_id
       FROM technician_profiles tp
       JOIN technician_services ts ON ts.technician_id = tp.id
       WHERE tp.availability = 'online'
         AND tp.verification_status = 'approved'
         AND ts.category_id = ?
         AND (
           6371 * acos(
             cos(radians(?)) * cos(radians(tp.current_latitude)) *
             cos(radians(tp.current_longitude) - radians(?)) +
             sin(radians(?)) * sin(radians(tp.current_latitude))
           )
         ) <= COALESCE(tp.coverage_radius_km, 10)`,
      [request.category_id, request.latitude, request.longitude, request.latitude]
    );

    const userIds = technicians.map((t: any) => t.user_id);
    if (userIds.length) {
      await this.sendToMultipleUsers(userIds, {
        type: 'request_created',
        titleAr: 'طلب خدمة جديد',
        bodyAr: `طلب جديد: ${request.title}`,
        data: { requestId: request.id },
      });
    }
  }

  async getUnread(userId: string): Promise<any[]> {
    return db.query<any[]>(
      'SELECT * FROM notifications WHERE user_id = ? AND is_read = 0 ORDER BY created_at DESC LIMIT 50',
      [userId]
    );
  }

  async markRead(notifId: string, userId: string): Promise<void> {
    await db.query(
      'UPDATE notifications SET is_read = 1, read_at = NOW() WHERE id = ? AND user_id = ?',
      [notifId, userId]
    );
  }

  async markAllRead(userId: string): Promise<void> {
    await db.query(
      'UPDATE notifications SET is_read = 1, read_at = NOW() WHERE user_id = ? AND is_read = 0',
      [userId]
    );
  }

  async getAll(userId: string, page: number = 1, limit: number = 20): Promise<{ rows: any[]; total: number }> {
    const offset = (page - 1) * limit;
    const [rows, countRows] = await Promise.all([
      db.query<any[]>(
        'SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT ? OFFSET ?',
        [userId, limit, offset]
      ),
      db.query<any[]>('SELECT COUNT(*) as total FROM notifications WHERE user_id = ?', [userId]),
    ]);
    return { rows, total: countRows[0].total };
  }

  async getAllLogs(page: number = 1, limit: number = 20): Promise<{ rows: any[]; total: number }> {
    const offset = (page - 1) * limit;
    const [rows, countRows] = await Promise.all([
      db.query<any[]>(
        `SELECT n.*, u.full_name as user_name, u.phone as user_phone
         FROM notifications n JOIN users u ON n.user_id = u.id
         ORDER BY n.created_at DESC LIMIT ? OFFSET ?`,
        [limit, offset]
      ),
      db.query<any[]>('SELECT COUNT(*) as total FROM notifications'),
    ]);
    return { rows, total: countRows[0].total };
  }

  async broadcast(userIds: string[], titleAr: string, bodyAr: string, type: string = 'broadcast'): Promise<void> {
    await this.sendToMultipleUsers(userIds, { type, titleAr, bodyAr });
  }

  private async sendPushNotification(fcmToken: string, payload: NotificationPayload): Promise<void> {
    // In production: use firebase-admin to send push notifications
    // Example:
    // await admin.messaging().send({
    //   token: fcmToken,
    //   notification: { title: payload.titleAr, body: payload.bodyAr },
    //   data: payload.data ? mapToStringRecord(payload.data) : {},
    //   android: { priority: 'high' },
    //   apns: { payload: { aps: { sound: 'default' } } },
    // });
    logger.debug(`[FCM] Push to ${fcmToken.slice(0, 12)}...: ${payload.type}`);
  }
}
