import mysql, { Pool, PoolConnection } from 'mysql2/promise';
import { config } from '../../config';
import { logger } from '../logger';

class Database {
  private static instance: Database;
  private pool: Pool;

  private constructor() {
    this.pool = mysql.createPool({
      host: config.db.host,
      port: config.db.port,
      user: config.db.user,
      password: config.db.password,
      database: config.db.name,
      connectionLimit: config.db.connectionLimit,
      waitForConnections: true,
      queueLimit: 0,
      charset: 'utf8mb4',
      timezone: '+02:00',
    });

    logger.info('Database connection pool initialized');
  }

  public static getInstance(): Database {
    if (!Database.instance) {
      Database.instance = new Database();
    }
    return Database.instance;
  }

  public getPool(): Pool {
    return this.pool;
  }

  public async getConnection(): Promise<PoolConnection> {
    return this.pool.getConnection();
  }

  public async query<T = unknown>(sql: string, params?: any[]): Promise<T> {
    const [rows] = await this.pool.query(sql, params);
    return rows as T;
  }

  public async transaction<T>(callback: (connection: PoolConnection) => Promise<T>): Promise<T> {
    const connection = await this.getConnection();
    await connection.beginTransaction();
    try {
      const result = await callback(connection);
      await connection.commit();
      return result;
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  public async testConnection(): Promise<void> {
    try {
      await this.pool.execute('SELECT 1');
      logger.info('Database connection verified');
    } catch (error) {
      logger.error('Database connection failed:', error);
      throw error;
    }
  }

  public async close(): Promise<void> {
    await this.pool.end();
    logger.info('Database connection pool closed');
  }
}

export const db = Database.getInstance();
