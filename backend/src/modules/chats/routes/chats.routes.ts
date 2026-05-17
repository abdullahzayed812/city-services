import { Router, Request, Response } from 'express';
import { authenticate } from '../../../shared/middlewares/auth.middleware';
import { asyncHandler } from '../../../shared/middlewares/error.middleware';
import { sendSuccess } from '../../../shared/utils/response';
import { db } from '../../../core/database';
import { v4 as uuidv4 } from 'uuid';
import { NotFoundError, ForbiddenError } from '../../../shared/errors/AppError';

const router = Router();
router.use(authenticate);

// GET /chats/:requestId — load or create chat + return message history
router.get('/:requestId', asyncHandler(async (req: Request, res: Response) => {
  const { requestId } = req.params;
  const userId = req.user!.userId;

  const requests = await db.query<any[]>(
    'SELECT id, customer_id, accepted_technician_id, status FROM service_requests WHERE id = ? LIMIT 1',
    [requestId]
  );
  if (!requests[0]) throw new NotFoundError('الطلب');

  const request = requests[0];
  const isParticipant =
    request.customer_id === userId ||
    request.accepted_technician_id === userId;

  if (!isParticipant) throw new ForbiddenError('ليس لديك صلاحية للوصول لهذه المحادثة');

  let chats = await db.query<any[]>(
    'SELECT * FROM chats WHERE request_id = ? LIMIT 1',
    [requestId]
  );

  if (!chats[0]) {
    const chatId = uuidv4();
    await db.query(
      'INSERT INTO chats (id, request_id, customer_id, technician_id) VALUES (?, ?, ?, ?)',
      [chatId, requestId, request.customer_id, request.accepted_technician_id]
    );
    chats = await db.query<any[]>('SELECT * FROM chats WHERE id = ? LIMIT 1', [chatId]);
  }

  const chat = chats[0];

  const messages = await db.query<any[]>(
    `SELECT m.*, u.full_name as sender_name, u.avatar_url as sender_avatar
     FROM messages m
     JOIN users u ON m.sender_id = u.id
     WHERE m.chat_id = ?
     ORDER BY m.created_at ASC`,
    [chat.id]
  );

  sendSuccess(res, { ...chat, messages });
}));

export default router;
