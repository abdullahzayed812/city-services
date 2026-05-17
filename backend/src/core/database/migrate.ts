import { db } from './index';
import { logger } from '../logger';

const createTables = async (): Promise<void> => {
  const queries = [
    // ===================== USERS =====================
    `CREATE TABLE IF NOT EXISTS users (
      id VARCHAR(36) PRIMARY KEY,
      phone VARCHAR(20) UNIQUE NOT NULL,
      email VARCHAR(255) UNIQUE,
      password_hash VARCHAR(255) NOT NULL,
      full_name VARCHAR(100) NOT NULL,
      avatar_url VARCHAR(500),
      role ENUM('customer','technician','admin') NOT NULL DEFAULT 'customer',
      status ENUM('active','inactive','suspended','pending_verification') NOT NULL DEFAULT 'pending_verification',
      phone_verified TINYINT(1) NOT NULL DEFAULT 0,
      email_verified TINYINT(1) NOT NULL DEFAULT 0,
      fcm_token VARCHAR(500),
      last_login_at DATETIME,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_phone (phone),
      INDEX idx_role (role),
      INDEX idx_status (status)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

    // ===================== OTP CODES =====================
    `CREATE TABLE IF NOT EXISTS otp_codes (
      id VARCHAR(36) PRIMARY KEY,
      phone VARCHAR(20) NOT NULL,
      code VARCHAR(10) NOT NULL,
      purpose ENUM('registration','login','password_reset') NOT NULL,
      attempts INT NOT NULL DEFAULT 0,
      expires_at DATETIME NOT NULL,
      used_at DATETIME,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_phone_purpose (phone, purpose)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

    // ===================== REFRESH TOKENS =====================
    `CREATE TABLE IF NOT EXISTS refresh_tokens (
      id VARCHAR(36) PRIMARY KEY,
      user_id VARCHAR(36) NOT NULL,
      token_hash VARCHAR(255) NOT NULL,
      expires_at DATETIME NOT NULL,
      revoked_at DATETIME,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      INDEX idx_token_hash (token_hash),
      INDEX idx_user_id (user_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

    // ===================== CUSTOMER PROFILES =====================
    `CREATE TABLE IF NOT EXISTS customer_profiles (
      id VARCHAR(36) PRIMARY KEY,
      user_id VARCHAR(36) UNIQUE NOT NULL,
      default_address VARCHAR(500),
      default_latitude DECIMAL(10,8),
      default_longitude DECIMAL(11,8),
      total_requests INT NOT NULL DEFAULT 0,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

    // ===================== TECHNICIAN PROFILES =====================
    `CREATE TABLE IF NOT EXISTS technician_profiles (
      id VARCHAR(36) PRIMARY KEY,
      user_id VARCHAR(36) UNIQUE NOT NULL,
      bio TEXT,
      years_experience INT NOT NULL DEFAULT 0,
      availability ENUM('online','offline','busy') NOT NULL DEFAULT 'offline',
      verification_status ENUM('pending','approved','rejected','suspended') NOT NULL DEFAULT 'pending',
      rejection_reason TEXT,
      id_document_url VARCHAR(500),
      id_document_back_url VARCHAR(500),
      current_latitude DECIMAL(10,8),
      current_longitude DECIMAL(11,8),
      coverage_radius_km INT NOT NULL DEFAULT 10,
      rating_average DECIMAL(3,2) NOT NULL DEFAULT 0,
      rating_count INT NOT NULL DEFAULT 0,
      total_jobs INT NOT NULL DEFAULT 0,
      completed_jobs INT NOT NULL DEFAULT 0,
      is_featured TINYINT(1) NOT NULL DEFAULT 0,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      INDEX idx_availability (availability),
      INDEX idx_verification_status (verification_status),
      INDEX idx_location (current_latitude, current_longitude)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

    // ===================== SERVICE CATEGORIES =====================
    `CREATE TABLE IF NOT EXISTS service_categories (
      id VARCHAR(36) PRIMARY KEY,
      name_ar VARCHAR(100) NOT NULL,
      name_en VARCHAR(100),
      description_ar TEXT,
      description_en TEXT,
      icon_url VARCHAR(500),
      color_hex VARCHAR(7),
      base_price DECIMAL(10,2),
      is_active TINYINT(1) NOT NULL DEFAULT 1,
      sort_order INT NOT NULL DEFAULT 0,
      parent_id VARCHAR(36),
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (parent_id) REFERENCES service_categories(id) ON DELETE SET NULL,
      INDEX idx_is_active (is_active),
      INDEX idx_sort_order (sort_order)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

    // ===================== TECHNICIAN SERVICES =====================
    `CREATE TABLE IF NOT EXISTS technician_services (
      id VARCHAR(36) PRIMARY KEY,
      technician_id VARCHAR(36) NOT NULL,
      category_id VARCHAR(36) NOT NULL,
      price_from DECIMAL(10,2),
      price_to DECIMAL(10,2),
      is_primary TINYINT(1) NOT NULL DEFAULT 0,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      UNIQUE KEY uk_tech_cat (technician_id, category_id),
      FOREIGN KEY (technician_id) REFERENCES technician_profiles(id) ON DELETE CASCADE,
      FOREIGN KEY (category_id) REFERENCES service_categories(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

    // ===================== TECHNICIAN PORTFOLIO =====================
    `CREATE TABLE IF NOT EXISTS technician_portfolio (
      id VARCHAR(36) PRIMARY KEY,
      technician_id VARCHAR(36) NOT NULL,
      image_url VARCHAR(500) NOT NULL,
      caption VARCHAR(255),
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (technician_id) REFERENCES technician_profiles(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

    // ===================== SERVICE REQUESTS =====================
    `CREATE TABLE IF NOT EXISTS service_requests (
      id VARCHAR(36) PRIMARY KEY,
      customer_id VARCHAR(36) NOT NULL,
      category_id VARCHAR(36) NOT NULL,
      title VARCHAR(255) NOT NULL,
      description TEXT NOT NULL,
      request_type ENUM('instant','scheduled','emergency') NOT NULL DEFAULT 'instant',
      status ENUM('pending','active','accepted','in_progress','completed','cancelled','expired') NOT NULL DEFAULT 'pending',
      address TEXT NOT NULL,
      latitude DECIMAL(10,8) NOT NULL,
      longitude DECIMAL(11,8) NOT NULL,
      scheduled_at DATETIME,
      budget_from DECIMAL(10,2),
      budget_to DECIMAL(10,2),
      final_price DECIMAL(10,2),
      payment_method ENUM('wallet','cash','card','instapay') DEFAULT 'cash',
      accepted_proposal_id VARCHAR(36),
      accepted_technician_id VARCHAR(36),
      cancellation_reason TEXT,
      cancelled_by VARCHAR(36),
      expires_at DATETIME,
      started_at DATETIME,
      completed_at DATETIME,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (customer_id) REFERENCES users(id),
      FOREIGN KEY (category_id) REFERENCES service_categories(id),
      INDEX idx_customer_id (customer_id),
      INDEX idx_status (status),
      INDEX idx_request_type (request_type),
      INDEX idx_created_at (created_at)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

    // ===================== REQUEST IMAGES =====================
    `CREATE TABLE IF NOT EXISTS request_images (
      id VARCHAR(36) PRIMARY KEY,
      request_id VARCHAR(36) NOT NULL,
      image_url VARCHAR(500) NOT NULL,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (request_id) REFERENCES service_requests(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

    // ===================== REQUEST STATUS HISTORY =====================
    `CREATE TABLE IF NOT EXISTS request_status_history (
      id VARCHAR(36) PRIMARY KEY,
      request_id VARCHAR(36) NOT NULL,
      status ENUM('pending','active','accepted','in_progress','completed','cancelled','expired') NOT NULL,
      changed_by VARCHAR(36),
      note TEXT,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (request_id) REFERENCES service_requests(id) ON DELETE CASCADE,
      INDEX idx_request_id (request_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

    // ===================== PROPOSALS =====================
    `CREATE TABLE IF NOT EXISTS request_proposals (
      id VARCHAR(36) PRIMARY KEY,
      request_id VARCHAR(36) NOT NULL,
      technician_id VARCHAR(36) NOT NULL,
      proposed_price DECIMAL(10,2) NOT NULL,
      estimated_duration_minutes INT,
      message TEXT,
      status ENUM('pending','accepted','rejected','withdrawn') NOT NULL DEFAULT 'pending',
      is_counter_offer TINYINT(1) NOT NULL DEFAULT 0,
      parent_proposal_id VARCHAR(36),
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      UNIQUE KEY uk_request_technician (request_id, technician_id),
      FOREIGN KEY (request_id) REFERENCES service_requests(id) ON DELETE CASCADE,
      FOREIGN KEY (technician_id) REFERENCES users(id),
      INDEX idx_request_id (request_id),
      INDEX idx_technician_id (technician_id),
      INDEX idx_status (status)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

    // ===================== CHATS =====================
    `CREATE TABLE IF NOT EXISTS chats (
      id VARCHAR(36) PRIMARY KEY,
      request_id VARCHAR(36) UNIQUE NOT NULL,
      customer_id VARCHAR(36) NOT NULL,
      technician_id VARCHAR(36) NOT NULL,
      last_message_at DATETIME,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (request_id) REFERENCES service_requests(id),
      FOREIGN KEY (customer_id) REFERENCES users(id),
      FOREIGN KEY (technician_id) REFERENCES users(id),
      INDEX idx_customer_id (customer_id),
      INDEX idx_technician_id (technician_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

    // ===================== MESSAGES =====================
    `CREATE TABLE IF NOT EXISTS messages (
      id VARCHAR(36) PRIMARY KEY,
      chat_id VARCHAR(36) NOT NULL,
      sender_id VARCHAR(36) NOT NULL,
      content TEXT,
      message_type ENUM('text','image','voice','location') NOT NULL DEFAULT 'text',
      media_url VARCHAR(500),
      latitude DECIMAL(10,8),
      longitude DECIMAL(11,8),
      is_read TINYINT(1) NOT NULL DEFAULT 0,
      read_at DATETIME,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (chat_id) REFERENCES chats(id) ON DELETE CASCADE,
      FOREIGN KEY (sender_id) REFERENCES users(id),
      INDEX idx_chat_id (chat_id),
      INDEX idx_sender_id (sender_id),
      INDEX idx_created_at (created_at)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

    // ===================== WALLETS =====================
    `CREATE TABLE IF NOT EXISTS wallets (
      id VARCHAR(36) PRIMARY KEY,
      user_id VARCHAR(36) UNIQUE NOT NULL,
      balance DECIMAL(12,2) NOT NULL DEFAULT 0.00,
      pending_balance DECIMAL(12,2) NOT NULL DEFAULT 0.00,
      total_earned DECIMAL(12,2) NOT NULL DEFAULT 0.00,
      total_withdrawn DECIMAL(12,2) NOT NULL DEFAULT 0.00,
      currency VARCHAR(3) NOT NULL DEFAULT 'EGP',
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

    // ===================== TRANSACTIONS =====================
    `CREATE TABLE IF NOT EXISTS transactions (
      id VARCHAR(36) PRIMARY KEY,
      wallet_id VARCHAR(36) NOT NULL,
      user_id VARCHAR(36) NOT NULL,
      request_id VARCHAR(36),
      type ENUM('deposit','withdrawal','payment','refund','commission','earning') NOT NULL,
      status ENUM('pending','completed','failed','reversed') NOT NULL DEFAULT 'pending',
      amount DECIMAL(12,2) NOT NULL,
      balance_before DECIMAL(12,2) NOT NULL,
      balance_after DECIMAL(12,2) NOT NULL,
      description TEXT,
      reference VARCHAR(100),
      payment_method ENUM('wallet','cash','card','instapay'),
      external_reference VARCHAR(255),
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (wallet_id) REFERENCES wallets(id),
      FOREIGN KEY (user_id) REFERENCES users(id),
      INDEX idx_wallet_id (wallet_id),
      INDEX idx_user_id (user_id),
      INDEX idx_type (type),
      INDEX idx_created_at (created_at)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

    // ===================== WITHDRAWAL REQUESTS =====================
    `CREATE TABLE IF NOT EXISTS withdrawal_requests (
      id VARCHAR(36) PRIMARY KEY,
      technician_id VARCHAR(36) NOT NULL,
      amount DECIMAL(12,2) NOT NULL,
      bank_name VARCHAR(100),
      account_number VARCHAR(50),
      account_holder VARCHAR(100),
      instapay_number VARCHAR(20),
      status ENUM('pending','approved','rejected','processed') NOT NULL DEFAULT 'pending',
      admin_note TEXT,
      processed_at DATETIME,
      processed_by VARCHAR(36),
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (technician_id) REFERENCES users(id),
      INDEX idx_technician_id (technician_id),
      INDEX idx_status (status)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

    // ===================== REVIEWS =====================
    `CREATE TABLE IF NOT EXISTS reviews (
      id VARCHAR(36) PRIMARY KEY,
      request_id VARCHAR(36) UNIQUE NOT NULL,
      customer_id VARCHAR(36) NOT NULL,
      technician_id VARCHAR(36) NOT NULL,
      rating INT NOT NULL CHECK (rating BETWEEN 1 AND 5),
      comment TEXT,
      is_reported TINYINT(1) NOT NULL DEFAULT 0,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (request_id) REFERENCES service_requests(id),
      FOREIGN KEY (customer_id) REFERENCES users(id),
      FOREIGN KEY (technician_id) REFERENCES users(id),
      INDEX idx_technician_id (technician_id),
      INDEX idx_rating (rating)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

    // ===================== NOTIFICATIONS =====================
    `CREATE TABLE IF NOT EXISTS notifications (
      id VARCHAR(36) PRIMARY KEY,
      user_id VARCHAR(36) NOT NULL,
      type VARCHAR(50) NOT NULL,
      title_ar VARCHAR(255) NOT NULL,
      body_ar TEXT NOT NULL,
      data JSON,
      is_read TINYINT(1) NOT NULL DEFAULT 0,
      read_at DATETIME,
      sent_push TINYINT(1) NOT NULL DEFAULT 0,
      push_sent_at DATETIME,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      INDEX idx_user_id (user_id),
      INDEX idx_is_read (is_read),
      INDEX idx_created_at (created_at)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

    // ===================== REPORTS =====================
    `CREATE TABLE IF NOT EXISTS reports (
      id VARCHAR(36) PRIMARY KEY,
      reporter_id VARCHAR(36) NOT NULL,
      reported_user_id VARCHAR(36),
      request_id VARCHAR(36),
      review_id VARCHAR(36),
      reason VARCHAR(100) NOT NULL,
      description TEXT,
      status ENUM('pending','reviewed','resolved','dismissed') NOT NULL DEFAULT 'pending',
      admin_note TEXT,
      resolved_by VARCHAR(36),
      resolved_at DATETIME,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (reporter_id) REFERENCES users(id),
      INDEX idx_status (status),
      INDEX idx_reporter_id (reporter_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

    // ===================== ADMIN LOGS =====================
    `CREATE TABLE IF NOT EXISTS admin_logs (
      id VARCHAR(36) PRIMARY KEY,
      admin_id VARCHAR(36) NOT NULL,
      action VARCHAR(100) NOT NULL,
      entity_type VARCHAR(50),
      entity_id VARCHAR(36),
      description TEXT,
      ip_address VARCHAR(45),
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (admin_id) REFERENCES users(id),
      INDEX idx_admin_id (admin_id),
      INDEX idx_action (action),
      INDEX idx_created_at (created_at)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

    // ===================== SAVED ADDRESSES =====================
    `CREATE TABLE IF NOT EXISTS saved_addresses (
      id VARCHAR(36) PRIMARY KEY,
      user_id VARCHAR(36) NOT NULL,
      label VARCHAR(50) NOT NULL,
      address TEXT NOT NULL,
      latitude DECIMAL(10,8) NOT NULL,
      longitude DECIMAL(11,8) NOT NULL,
      is_default TINYINT(1) NOT NULL DEFAULT 0,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      INDEX idx_user_id (user_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
  ];

  for (const query of queries) {
    await db.query(query);
    logger.debug('Migration query executed');
  }

  logger.info('All migrations completed successfully');
};

const runMigrations = async (): Promise<void> => {
  try {
    logger.info('Running migrations...');
    await db.testConnection();
    await createTables();
    process.exit(0);
  } catch (error) {
    logger.error('Migration failed:', error);
    process.exit(1);
  }
};

runMigrations();
