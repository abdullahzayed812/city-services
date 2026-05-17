import { Server as HttpServer } from 'http';
import { Server, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { config } from '../../config';
import { logger } from '../../core/logger';
import { redis } from '../../core/redis';
import { JwtPayload, UserRole } from '../../shared/types';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../../core/database';

interface AuthenticatedSocket extends Socket {
  user?: JwtPayload;
}

export const initializeSocketIO = (httpServer: HttpServer): Server => {
  const io = new Server(httpServer, {
    cors: {
      origin: config.frontendUrl,
      methods: ['GET', 'POST'],
      credentials: true,
    },
    pingTimeout: 60000,
    pingInterval: 25000,
  });

  // JWT Authentication middleware
  io.use((socket: AuthenticatedSocket, next) => {
    const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.split(' ')[1];

    if (!token) {
      return next(new Error('مطلوب رمز المصادقة'));
    }

    try {
      const decoded = jwt.verify(token, config.jwt.secret) as JwtPayload;
      socket.user = decoded;
      next();
    } catch {
      next(new Error('رمز المصادقة غير صالح'));
    }
  });

  io.on('connection', async (socket: AuthenticatedSocket) => {
    const userId = socket.user!.userId;
    const role = socket.user!.role;

    logger.info(`[Socket] Connected: ${userId} (${role})`);

    // Join personal room
    socket.join(`user:${userId}`);

    // Join role room
    socket.join(`role:${role}`);

    // Mark as online in Redis
    await redis.hSet('online_users', userId, socket.id);

    // ============================================
    // TECHNICIAN: Location updates
    // ============================================
    socket.on('technician:update_location', async (data: { latitude: number; longitude: number }) => {
      if (role !== UserRole.TECHNICIAN) return;

      try {
        await redis.hSet(`technician_location:${userId}`, 'lat', String(data.latitude));
        await redis.hSet(`technician_location:${userId}`, 'lng', String(data.longitude));
        await redis.expire(`technician_location:${userId}`, 3600);

        await db.query(
          'UPDATE technician_profiles SET current_latitude = ?, current_longitude = ? WHERE user_id = ?',
          [data.latitude, data.longitude, userId]
        );

        // Broadcast to any customer tracking this technician
        const trackingRooms = await redis.keys(`tracking:${userId}:*`);
        for (const room of trackingRooms) {
          io.to(room).emit('technician:location_updated', {
            technicianId: userId,
            latitude: data.latitude,
            longitude: data.longitude,
            timestamp: new Date().toISOString(),
          });
        }
      } catch (error) {
        logger.error('Failed to update technician location:', error);
      }
    });

    // ============================================
    // CUSTOMER: Track technician
    // ============================================
    socket.on('customer:track_technician', async (data: { requestId: string; technicianId: string }) => {
      if (role !== UserRole.CUSTOMER) return;

      const room = `tracking:${data.technicianId}:${data.requestId}`;
      socket.join(room);
      await redis.set(room, userId, 7200);

      // Send current location if available
      const location = await redis.hGetAll(`technician_location:${data.technicianId}`);
      if (location.lat && location.lng) {
        socket.emit('technician:location_updated', {
          technicianId: data.technicianId,
          latitude: parseFloat(location.lat),
          longitude: parseFloat(location.lng),
        });
      }
    });

    socket.on('customer:stop_tracking', async (data: { requestId: string; technicianId: string }) => {
      const room = `tracking:${data.technicianId}:${data.requestId}`;
      socket.leave(room);
      await redis.del(room);
    });

    // ============================================
    // CHAT: Real-time messaging
    // ============================================
    socket.on('chat:join', async (data: { requestId: string }) => {
      const chatRoom = `chat:${data.requestId}`;
      socket.join(chatRoom);

      // Mark messages as read
      await db.query(
        `UPDATE messages m
         JOIN chats c ON m.chat_id = c.id
         SET m.is_read = 1, m.read_at = NOW()
         WHERE c.request_id = ? AND m.sender_id != ? AND m.is_read = 0`,
        [data.requestId, userId]
      );
    });

    socket.on('chat:send_message', async (data: {
      requestId: string;
      content: string;
      messageType: string;
      mediaUrl?: string;
      latitude?: number;
      longitude?: number;
    }) => {
      try {
        const chats = await db.query<any[]>(
          'SELECT * FROM chats WHERE request_id = ? LIMIT 1',
          [data.requestId]
        );

        let chatId: string;
        if (chats[0]) {
          chatId = chats[0].id;
        } else {
          const request = await db.query<any[]>(
            'SELECT customer_id, accepted_technician_id FROM service_requests WHERE id = ? LIMIT 1',
            [data.requestId]
          );
          if (!request[0]) return;

          chatId = uuidv4();
          await db.query(
            'INSERT INTO chats (id, request_id, customer_id, technician_id) VALUES (?, ?, ?, ?)',
            [chatId, data.requestId, request[0].customer_id, request[0].accepted_technician_id]
          );
        }

        const messageId = uuidv4();
        await db.query(
          `INSERT INTO messages (id, chat_id, sender_id, content, message_type, media_url, latitude, longitude)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [messageId, chatId, userId, data.content || null, data.messageType || 'text',
           data.mediaUrl || null, data.latitude || null, data.longitude || null]
        );

        await db.query(
          'UPDATE chats SET last_message_at = NOW() WHERE id = ?',
          [chatId]
        );

        const message = {
          id: messageId,
          chatId,
          senderId: userId,
          content: data.content,
          messageType: data.messageType || 'text',
          mediaUrl: data.mediaUrl,
          createdAt: new Date().toISOString(),
        };

        // Broadcast to chat room
        io.to(`chat:${data.requestId}`).emit('chat:message_received', message);

        // Push notification to offline user
        const chatRoom = `chat:${data.requestId}`;
        const socketsInRoom = await io.in(chatRoom).fetchSockets();
        const receiverOnline = socketsInRoom.some(s => (s as any).user?.userId !== userId);

        if (!receiverOnline) {
          // Send push notification to offline user
          logger.debug('[Chat] Receiver offline, push notification queued');
        }
      } catch (error) {
        logger.error('Failed to send chat message:', error);
        socket.emit('chat:error', { message: 'فشل إرسال الرسالة' });
      }
    });

    socket.on('chat:typing', (data: { requestId: string }) => {
      socket.to(`chat:${data.requestId}`).emit('chat:user_typing', { userId });
    });

    socket.on('chat:stop_typing', (data: { requestId: string }) => {
      socket.to(`chat:${data.requestId}`).emit('chat:user_stopped_typing', { userId });
    });

    // ============================================
    // TECHNICIAN: Availability toggle
    // ============================================
    socket.on('technician:set_availability', async (data: { availability: string }) => {
      if (role !== UserRole.TECHNICIAN) return;

      await db.query(
        'UPDATE technician_profiles SET availability = ? WHERE user_id = ?',
        [data.availability, userId]
      );
      await redis.hSet('technician_availability', userId, data.availability);

      socket.emit('technician:availability_updated', { availability: data.availability });
    });

    // ============================================
    // Disconnect handler
    // ============================================
    socket.on('disconnect', async () => {
      logger.info(`[Socket] Disconnected: ${userId}`);

      await redis.hDel('online_users', userId);

      if (role === UserRole.TECHNICIAN) {
        await redis.hSet('technician_availability', userId, 'offline');
        await db.query(
          "UPDATE technician_profiles SET availability = 'offline' WHERE user_id = ?",
          [userId]
        );
      }
    });
  });

  // Export io for use in other modules
  (global as any).io = io;

  logger.info('Socket.IO initialized');
  return io;
};

export const emitToUser = (userId: string, event: string, data: unknown): void => {
  const io: Server = (global as any).io;
  if (io) {
    io.to(`user:${userId}`).emit(event, data);
  }
};

export const emitToRole = (role: string, event: string, data: unknown): void => {
  const io: Server = (global as any).io;
  if (io) {
    io.to(`role:${role}`).emit(event, data);
  }
};
