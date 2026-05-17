import { db } from './index';
import { logger } from '../logger';

const TABLES_IN_DROP_ORDER = [
  'admin_logs',
  'reports',
  'messages',
  'chats',
  'reviews',
  'transactions',
  'withdrawal_requests',
  'wallets',
  'notifications',
  'request_status_history',
  'request_images',
  'request_proposals',
  'service_requests',
  'technician_portfolio',
  'technician_services',
  'technician_profiles',
  'customer_profiles',
  'saved_addresses',
  'service_categories',
  'otp_codes',
  'refresh_tokens',
  'users',
];

const reset = async (): Promise<void> => {
  try {
    await db.testConnection();
    logger.info('Starting database reset...');

    await db.query('SET FOREIGN_KEY_CHECKS = 0');
    for (const table of TABLES_IN_DROP_ORDER) {
      await db.query(`DROP TABLE IF EXISTS \`${table}\``);
      logger.debug(`Dropped table: ${table}`);
    }
    await db.query('SET FOREIGN_KEY_CHECKS = 1');

    logger.info('All tables dropped. Run migration:run then migration:seed to rebuild.');
    process.exit(0);
  } catch (error) {
    logger.error('Reset failed:', error);
    process.exit(1);
  }
};

reset();
