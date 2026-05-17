import express, { Application } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import morgan from 'morgan';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import path from 'path';

import { config } from './config';
import { logger } from './core/logger';
import { errorHandler, notFoundHandler } from './shared/middlewares/error.middleware';
import routes from './routes';

export const createApp = (): Application => {
  const app = express();

  // ==========================================
  // Security middlewares
  // ==========================================
  app.use(helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  }));

  app.use(cors({
    origin: [config.frontendUrl, 'http://localhost:3000', 'http://localhost:19006'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept-Language'],
  }));

  // ==========================================
  // Rate limiting
  // ==========================================
  app.use(
    '/api/',
    rateLimit({
      windowMs: config.rateLimit.windowMs,
      max: config.rateLimit.max,
      message: { success: false, message: 'طلبات كثيرة جداً. يرجى المحاولة لاحقاً' },
      standardHeaders: true,
      legacyHeaders: false,
    })
  );

  // Auth endpoints stricter rate limit
  app.use(
    '/api/auth/login',
    rateLimit({ windowMs: 15 * 60 * 1000, max: 10, message: { success: false, message: 'محاولات دخول كثيرة. يرجى الانتظار.' } })
  );

  app.use(
    '/api/auth/request-otp',
    rateLimit({ windowMs: 60 * 60 * 1000, max: 5, message: { success: false, message: 'تجاوزت الحد المسموح به لطلبات OTP' } })
  );

  // ==========================================
  // General middlewares
  // ==========================================
  app.use(compression());
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  if (!config.isProduction) {
    app.use(morgan('dev'));
  } else {
    app.use(morgan('combined', {
      stream: { write: (message) => logger.http(message.trim()) },
    }));
  }

  // ==========================================
  // Static files (uploads)
  // ==========================================
  app.use('/uploads', express.static(path.join(process.cwd(), 'uploads'), {
    maxAge: '7d',
    setHeaders: (res) => {
      res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
    },
  }));

  // ==========================================
  // Health check
  // ==========================================
  app.get('/health', (_req, res) => {
    res.json({
      status: 'ok',
      service: 'منصة خدمات برج العرب',
      version: '1.0.0',
      timestamp: new Date().toISOString(),
    });
  });

  // ==========================================
  // API Routes
  // ==========================================
  app.use('/api/v1', routes);

  // ==========================================
  // Error handlers (must be last)
  // ==========================================
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
};
