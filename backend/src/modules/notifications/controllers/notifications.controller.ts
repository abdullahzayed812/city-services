import { Request, Response } from 'express';
import { NotificationService } from '../services/notification.service';
import { sendSuccess, sendPaginated } from '../../../shared/utils/response';
import { asyncHandler } from '../../../shared/middlewares/error.middleware';
import { getPagination } from '../../../shared/utils/pagination';

export class NotificationsController {
  private readonly service: NotificationService;

  constructor() {
    this.service = new NotificationService();
  }

  getAll = asyncHandler(async (req: Request, res: Response) => {
    const { page, limit } = getPagination(req);
    const { rows, total } = await this.service.getAll(req.user!.userId, page, limit);
    sendPaginated(res, rows, total, page, limit);
  });

  getUnread = asyncHandler(async (req: Request, res: Response) => {
    const notifications = await this.service.getUnread(req.user!.userId);
    sendSuccess(res, notifications);
  });

  markRead = asyncHandler(async (req: Request, res: Response) => {
    await this.service.markRead(req.params.id, req.user!.userId);
    sendSuccess(res, null, 'تم تعليم الإشعار كمقروء');
  });

  markAllRead = asyncHandler(async (req: Request, res: Response) => {
    await this.service.markAllRead(req.user!.userId);
    sendSuccess(res, null, 'تم تعليم جميع الإشعارات كمقروءة');
  });

  getAdminLogs = asyncHandler(async (req: Request, res: Response) => {
    const { page, limit } = getPagination(req);
    const { rows, total } = await this.service.getAllLogs(page, limit);
    sendPaginated(res, rows, total, page, limit);
  });

  broadcast = asyncHandler(async (req: Request, res: Response) => {
    const { user_ids, title_ar, body_ar, type } = req.body;
    await this.service.broadcast(user_ids, title_ar, body_ar, type);
    sendSuccess(res, null, 'تم إرسال الإشعار بنجاح');
  });
}
