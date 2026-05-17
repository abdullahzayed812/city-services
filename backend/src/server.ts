import http from 'http';
import { createApp } from './app';
import { config } from './config';
import { logger } from './core/logger';
import { db } from './core/database';
import { redis } from './core/redis';
import { initializeSocketIO } from './presentation/http/socket';
import { initializeBackgroundJobs } from './core/jobs';
import { ensureUploadDirs } from './core/storage';
import { eventBus, AppEvents } from './core/events/EventBus';
import { emitToUser } from './presentation/http/socket';

const bootstrap = async (): Promise<void> => {
  try {
    ensureUploadDirs();
    await db.testConnection();
    await redis.connect();

    const app = createApp();
    const httpServer = http.createServer(app);

    initializeSocketIO(httpServer);
    initializeBackgroundJobs();
    registerEventListeners();

    httpServer.listen(config.port, () => {
      logger.info(`Server running on port ${config.port} [${config.env}]`);
    });

    process.on('SIGTERM', gracefulShutdown(httpServer));
    process.on('SIGINT', gracefulShutdown(httpServer));

  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

const registerEventListeners = (): void => {
  eventBus.on(AppEvents.PROPOSAL_ACCEPTED, (data: any) => {
    emitToUser(data.technicianId, 'proposal:accepted', { requestId: data.requestId });
    emitToUser(data.customerId, 'request:technician_assigned', { technicianId: data.technicianId });
  });

  eventBus.on(AppEvents.REQUEST_COMPLETED, (data: any) => {
    emitToUser(data.customerId, 'request:completed', { requestId: data.requestId });
  });

  eventBus.on(AppEvents.REQUEST_CANCELLED, (data: any) => {
    logger.info(`[Event] Request cancelled: ${data.requestId}`);
  });
};

const gracefulShutdown = (server: http.Server) => () => {
  logger.info('Graceful shutdown initiated...');
  server.close(async () => {
    await db.close();
    await redis.close();
    logger.info('Server shut down cleanly');
    process.exit(0);
  });
};

bootstrap();
