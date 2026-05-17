import { RequestsRepository } from '../repositories/requests.repository';
import { NotificationService } from '../../notifications/services/notification.service';
import { eventBus, AppEvents } from '../../../core/events/EventBus';
import { processAndSaveImage } from '../../../core/storage';
import { redis } from '../../../core/redis';
import {
  NotFoundError, ForbiddenError, BadRequestError,
} from '../../../shared/errors/AppError';
import { ServiceRequestStatus, RequestType } from '../../../shared/types';

export class RequestsService {
  private readonly repo: RequestsRepository;
  private readonly notificationService: NotificationService;

  constructor() {
    this.repo = new RequestsRepository();
    this.notificationService = new NotificationService();
  }

  async createRequest(customerId: string, data: {
    categoryId: string;
    title: string;
    description: string;
    requestType: RequestType;
    address: string;
    latitude: number;
    longitude: number;
    scheduledAt?: Date;
    budgetFrom?: number;
    budgetTo?: number;
    paymentMethod?: string;
    images?: Express.Multer.File[];
  }): Promise<object> {
    const imageUrls: string[] = [];

    if (data.images?.length) {
      for (const image of data.images) {
        const url = await processAndSaveImage(image.buffer, 'images');
        imageUrls.push(url);
      }
    }

    const requestId = await this.repo.create({
      customerId,
      categoryId: data.categoryId,
      title: data.title,
      description: data.description,
      requestType: data.requestType,
      address: data.address,
      latitude: data.latitude,
      longitude: data.longitude,
      scheduledAt: data.scheduledAt,
      budgetFrom: data.budgetFrom,
      budgetTo: data.budgetTo,
      paymentMethod: data.paymentMethod,
      imageUrls,
    });

    const request = await this.repo.findById(requestId);

    // Invalidate nearby technician cache
    await redis.del(`nearby_requests:${data.latitude}:${data.longitude}`);

    eventBus.emit(AppEvents.REQUEST_CREATED, { requestId, customerId, latitude: data.latitude, longitude: data.longitude });

    // Notify nearby technicians
    await this.notificationService.notifyNearbyTechnicians(request);

    return request;
  }

  async getRequest(requestId: string, userId: string, role?: string): Promise<object> {
    const request = await this.repo.findById(requestId);
    if (!request) throw new NotFoundError('الطلب');

    const hasAccess =
      role === 'admin' ||
      request.customer_id === userId ||
      request.accepted_technician_id === userId ||
      (role === 'technician' && request.status === 'pending');

    if (!hasAccess) {
      throw new ForbiddenError('ليس لديك صلاحية لعرض هذا الطلب');
    }

    return request;
  }

  async getCustomerRequests(customerId: string, status?: string, page: number = 1, limit: number = 20) {
    return this.repo.findByCustomer(customerId, status, page, limit);
  }

  async getTechnicianJobs(technicianId: string, status?: string, page: number = 1, limit: number = 20) {
    return this.repo.findByTechnician(technicianId, status, page, limit);
  }

  async getNearbyRequests(technicianId: string, latitude: number, longitude: number, radiusKm?: number): Promise<object[]> {
    const cacheKey = `nearby_requests:${Math.round(latitude * 100)}:${Math.round(longitude * 100)}`;
    const cached = await redis.getJSON<object[]>(cacheKey);
    if (cached) return cached;

    const requests = await this.repo.findNearbyPending(latitude, longitude, radiusKm);
    await redis.setJSON(cacheKey, requests, 30); // 30s cache
    return requests;
  }

  async cancelRequest(requestId: string, customerId: string, reason: string): Promise<void> {
    const request = await this.repo.findById(requestId);
    if (!request) throw new NotFoundError('الطلب');
    if (request.customer_id !== customerId) throw new ForbiddenError();

    const cancelableStatuses = ['pending', 'active'];
    if (!cancelableStatuses.includes(request.status)) {
      throw new BadRequestError('لا يمكن إلغاء الطلب في مرحلته الحالية');
    }

    await this.repo.cancel(requestId, reason, customerId);
    eventBus.emit(AppEvents.REQUEST_CANCELLED, { requestId, reason });
  }

  async markStarted(requestId: string, technicianId: string): Promise<void> {
    const request = await this.repo.findById(requestId);
    if (!request) throw new NotFoundError('الطلب');
    if (request.accepted_technician_id !== technicianId) throw new ForbiddenError();
    if (request.status !== 'accepted') throw new BadRequestError('حالة الطلب غير صحيحة');

    await this.repo.updateStatus(requestId, ServiceRequestStatus.IN_PROGRESS, technicianId);
    eventBus.emit(AppEvents.REQUEST_STARTED, { requestId, technicianId });

    await this.notificationService.sendToUser(request.customer_id, {
      type: 'service_started',
      titleAr: 'بدأ الفني العمل',
      bodyAr: 'وصل الفني وبدأ في تنفيذ الخدمة',
      data: { requestId },
    });
  }

  async markCompleted(requestId: string, technicianId: string): Promise<void> {
    const request = await this.repo.findById(requestId);
    if (!request) throw new NotFoundError('الطلب');
    if (request.accepted_technician_id !== technicianId) throw new ForbiddenError();
    if (request.status !== 'in_progress') throw new BadRequestError('الطلب لم يبدأ بعد');

    await this.repo.complete(requestId);
    eventBus.emit(AppEvents.REQUEST_COMPLETED, { requestId, technicianId });

    await this.notificationService.sendToUser(request.customer_id, {
      type: 'service_completed',
      titleAr: 'اكتملت الخدمة',
      bodyAr: 'تم إنهاء الخدمة بنجاح. يمكنك الآن تقييم الفني.',
      data: { requestId },
    });
  }

  async getAllPendingRequests(page: number = 1, limit: number = 50): Promise<{ rows: any[]; total: number }> {
    return this.repo.findAllPending(page, limit);
  }

  async getAllRequests(filters: object): Promise<{ rows: any[]; total: number }> {
    return this.repo.findAll(filters as any);
  }

  async getRequestHistory(requestId: string): Promise<object[]> {
    return this.repo.findStatusHistory(requestId);
  }
}
