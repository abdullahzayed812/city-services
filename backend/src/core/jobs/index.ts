import cron from 'node-cron';
import { db } from '../database';
import { redis } from '../redis';
import { logger } from '../logger';

export const initializeBackgroundJobs = (): void => {
  // Expire old pending requests every 15 minutes
  cron.schedule('*/15 * * * *', async () => {
    try {
      const expired = await db.query<any>(
        'UPDATE service_requests SET status = ? WHERE status = ? AND expires_at < NOW()',
        ['expired', 'pending']
      );
      if (expired.affectedRows > 0) {
        logger.info(`[Jobs] Expired ${expired.affectedRows} stale request(s)`);
      }
    } catch (error) {
      logger.error('[Jobs] Failed to expire pending requests:', error);
    }
  });

  // Clean old OTP codes every hour
  cron.schedule('0 * * * *', async () => {
    try {
      const cleaned = await db.query<any>(
        'DELETE FROM otp_codes WHERE expires_at < NOW() OR used_at IS NOT NULL AND created_at < DATE_SUB(NOW(), INTERVAL 24 HOUR)'
      );
      logger.debug(`[Jobs] Removed ${cleaned.affectedRows} expired OTP code(s)`);
    } catch (error) {
      logger.error('[Jobs] Failed to clean OTP codes:', error);
    }
  });

  // Revoke expired refresh tokens daily at midnight
  cron.schedule('0 0 * * *', async () => {
    try {
      await db.query('DELETE FROM refresh_tokens WHERE expires_at < NOW()');
      logger.info('[Jobs] Expired refresh tokens purged');
    } catch (error) {
      logger.error('[Jobs] Failed to purge refresh tokens:', error);
    }
  });

  // Invalidate KPI cache every 5 minutes
  cron.schedule('*/5 * * * *', async () => {
    try {
      await redis.del('admin_kpis');
    } catch (error) {
      logger.error('[Jobs] Failed to invalidate KPI cache:', error);
    }
  });

  // Clean offline technician location keys every 2 hours
  cron.schedule('0 */2 * * *', async () => {
    try {
      const offlineTechs = await db.query<any[]>(
        "SELECT user_id FROM technician_profiles WHERE availability = 'offline'"
      );
      for (const tech of offlineTechs) {
        await redis.del(`technician_location:${tech.user_id}`);
      }
    } catch (error) {
      logger.error('[Jobs] Failed to clean technician location keys:', error);
    }
  });

  logger.info('Background jobs initialized');
};
