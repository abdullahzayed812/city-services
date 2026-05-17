import { Request, Response } from 'express';
import { ReviewsService } from '../services/reviews.service';
import { sendSuccess, sendCreated, sendPaginated } from '../../../shared/utils/response';
import { asyncHandler } from '../../../shared/middlewares/error.middleware';
import { getPagination } from '../../../shared/utils/pagination';

export class ReviewsController {
  private readonly service: ReviewsService;

  constructor() {
    this.service = new ReviewsService();
  }

  submitReview = asyncHandler(async (req: Request, res: Response) => {
    const { request_id, rating, comment } = req.body;
    const review = await this.service.submitReview(req.user!.userId, {
      requestId: request_id,
      rating: parseInt(rating),
      comment,
    });
    sendCreated(res, review, 'شكراً على تقييمك');
  });

  getTechnicianReviews = asyncHandler(async (req: Request, res: Response) => {
    const { page, limit } = getPagination(req);
    const { rows, total } = await this.service.getTechnicianReviews(req.params.technicianId, page, limit);
    sendPaginated(res, rows, total, page, limit);
  });

  reportReview = asyncHandler(async (req: Request, res: Response) => {
    await this.service.reportReview(req.params.id, req.user!.userId, req.body.reason);
    sendSuccess(res, null, 'تم إرسال البلاغ بنجاح');
  });
}
