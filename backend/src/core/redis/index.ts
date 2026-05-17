import { createClient, RedisClientType } from 'redis';
import { config } from '../../config';
import { logger } from '../logger';

class RedisClient {
  private static instance: RedisClient;
  private client: RedisClientType;
  private isConnected: boolean = false;

  private constructor() {
    this.client = createClient({
      socket: {
        host: config.redis.host,
        port: config.redis.port,
      },
      password: config.redis.password,
    }) as RedisClientType;

    this.client.on('error', (err) => logger.error('Redis error:', err));
    this.client.on('connect', () => logger.info('Redis connected'));
    this.client.on('disconnect', () => {
      this.isConnected = false;
      logger.warn('Redis disconnected');
    });
  }

  public static getInstance(): RedisClient {
    if (!RedisClient.instance) {
      RedisClient.instance = new RedisClient();
    }
    return RedisClient.instance;
  }

  public async connect(): Promise<void> {
    if (!this.isConnected) {
      await this.client.connect();
      this.isConnected = true;
    }
  }

  public async get(key: string): Promise<string | null> {
    return this.client.get(key);
  }

  public async set(key: string, value: string, ttlSeconds?: number): Promise<void> {
    if (ttlSeconds) {
      await this.client.setEx(key, ttlSeconds, value);
    } else {
      await this.client.set(key, value);
    }
  }

  public async del(key: string): Promise<void> {
    await this.client.del(key);
  }

  public async exists(key: string): Promise<boolean> {
    const result = await this.client.exists(key);
    return result === 1;
  }

  public async hSet(key: string, field: string, value: string): Promise<void> {
    await this.client.hSet(key, field, value);
  }

  public async hGet(key: string, field: string): Promise<string | undefined> {
    return this.client.hGet(key, field);
  }

  public async hGetAll(key: string): Promise<Record<string, string>> {
    return this.client.hGetAll(key);
  }

  public async hDel(key: string, field: string): Promise<void> {
    await this.client.hDel(key, field);
  }

  public async expire(key: string, ttlSeconds: number): Promise<void> {
    await this.client.expire(key, ttlSeconds);
  }

  public async keys(pattern: string): Promise<string[]> {
    return this.client.keys(pattern);
  }

  public async setJSON<T>(key: string, value: T, ttlSeconds?: number): Promise<void> {
    await this.set(key, JSON.stringify(value), ttlSeconds);
  }

  public async getJSON<T>(key: string): Promise<T | null> {
    const value = await this.get(key);
    if (!value) return null;
    return JSON.parse(value) as T;
  }

  public async close(): Promise<void> {
    await this.client.quit();
    this.isConnected = false;
  }
}

export const redis = RedisClient.getInstance();
