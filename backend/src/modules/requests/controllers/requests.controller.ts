import { Request, Response } from 'express';
import { RequestsService } from '../services/requests.service';
import { sendSuccess, sendCreated, sendPaginated } from '../../../shared/utils/response';
import { asyncHandler } from '../../../shared/middlewares/error.middleware';
import { getPagination } from '../../../shared/utils/pagination';
import { RequestType } from '../../../shared/types';

export class RequestsController {
  private readonly service: RequestsService;

  constructor() {
    this.service = new RequestsService();
  }

  create = asyncHandler(async (req: Request, res: Response) => {
    const files = req.files as Express.Multer.File[] | undefined;
    const { category_id, title, description, request_type, address, latitude, longitude,
            scheduled_at, budget_from, budget_to, payment_method } = req.body;

    const request = await this.service.createRequest(req.user!.userId, {
      categoryId: category_id,
      title,
      description,
      requestType: request_type as RequestType,
      address,
      latitude: parseFloat(latitude),
      longitude: parseFloat(longitude),
      scheduledAt: scheduled_at ? new Date(scheduled_at) : undefined,
      budgetFrom: budget_from ? parseFloat(budget_from) : undefined,
      budgetTo: budget_to ? parseFloat(budget_to) : undefined,
      paymentMethod: payment_method,
      images: files,
    });

    sendCreated(res, request, 'تم إنشاء الطلب بنجاح');
  });

  getOne = asyncHandler(async (req: Request, res: Response) => {
    const request = await this.service.getRequest(req.params.id, req.user!.userId, req.user!.role);
    sendSuccess(res, request);
  });

  getMyRequests = asyncHandler(async (req: Request, res: Response) => {
    const { page, limit } = getPagination(req);
    const { status } = req.query;
    const { rows, total } = await this.service.getCustomerRequests(
      req.user!.userId, status as string, page, limit
    );
    sendPaginated(res, rows, total, page, limit);
  });

  getAllPending = asyncHandler(async (req: Request, res: Response) => {
    const { page, limit } = getPagination(req);
    const { rows, total } = await this.service.getAllPendingRequests(page, limit);
    sendPaginated(res, rows, total, page, limit);
  });

  getNearby = asyncHandler(async (req: Request, res: Response) => {
    const { latitude, longitude, radius } = req.query;
    const lat = parseFloat(latitude as string);
    const lon = parseFloat(longitude as string);
    if (!latitude || !longitude || isNaN(lat) || isNaN(lon)) {
      res.status(400).json({ success: false, message: 'يرجى توفير إحداثيات صالحة (latitude و longitude)' });
      return;
    }
    const requests = await this.service.getNearbyRequests(
      req.user!.userId,
      lat,
      lon,
      radius ? parseFloat(radius as string) : undefined
    );
    sendSuccess(res, requests);
  });

  getMyJobs = asyncHandler(async (req: Request, res: Response) => {
    const { page, limit } = getPagination(req);
    const { status } = req.query;
    const { rows, total } = await this.service.getTechnicianJobs(
      req.user!.userId, status as string, page, limit
    );
    sendPaginated(res, rows, total, page, limit);
  });

  cancel = asyncHandler(async (req: Request, res: Response) => {
    await this.service.cancelRequest(req.params.id, req.user!.userId, req.body.reason);
    sendSuccess(res, null, 'تم إلغاء الطلب بنجاح');
  });

  markStarted = asyncHandler(async (req: Request, res: Response) => {
    await this.service.markStarted(req.params.id, req.user!.userId);
    sendSuccess(res, null, 'تم تأكيد البدء في العمل');
  });

  markCompleted = asyncHandler(async (req: Request, res: Response) => {
    await this.service.markCompleted(req.params.id, req.user!.userId);
    sendSuccess(res, null, 'تم إنهاء العمل بنجاح');
  });

  getHistory = asyncHandler(async (req: Request, res: Response) => {
    const history = await this.service.getRequestHistory(req.params.id);
    sendSuccess(res, history);
  });

  getAllAdmin = asyncHandler(async (req: Request, res: Response) => {
    const { page, limit } = getPagination(req);
    const { status, category_id, request_type, search } = req.query;
    const { rows, total } = await this.service.getAllRequests({
      status, categoryId: category_id, requestType: request_type, search, page, limit,
    });
    sendPaginated(res, rows, total, page, limit);
  });
}
