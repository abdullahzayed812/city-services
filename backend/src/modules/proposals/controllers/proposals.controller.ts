import { Request, Response } from 'express';
import { ProposalsService } from '../services/proposals.service';
import { sendSuccess, sendCreated, sendPaginated } from '../../../shared/utils/response';
import { asyncHandler } from '../../../shared/middlewares/error.middleware';
import { getPagination } from '../../../shared/utils/pagination';

export class ProposalsController {
  private readonly service: ProposalsService;

  constructor() {
    this.service = new ProposalsService();
  }

  submit = asyncHandler(async (req: Request, res: Response) => {
    const { request_id, proposed_price, estimated_duration_minutes, message } = req.body;
    const proposal = await this.service.submitProposal(req.user!.userId, {
      requestId: request_id,
      proposedPrice: parseFloat(proposed_price),
      estimatedDurationMinutes: estimated_duration_minutes,
      message,
    });
    sendCreated(res, proposal, 'تم تقديم العرض بنجاح');
  });

  getForRequest = asyncHandler(async (req: Request, res: Response) => {
    const requestId = req.params.requestId || req.query.requestId as string;
    const proposals = await this.service.getRequestProposals(requestId, req.user!.userId, req.user!.role);
    sendSuccess(res, proposals);
  });

  accept = asyncHandler(async (req: Request, res: Response) => {
    await this.service.acceptProposal(req.params.id, req.user!.userId);
    sendSuccess(res, null, 'تم قبول العرض بنجاح');
  });

  reject = asyncHandler(async (req: Request, res: Response) => {
    await this.service.rejectProposal(req.params.id, req.user!.userId);
    sendSuccess(res, null, 'تم رفض العرض');
  });

  withdraw = asyncHandler(async (req: Request, res: Response) => {
    await this.service.withdrawProposal(req.params.id, req.user!.userId);
    sendSuccess(res, null, 'تم سحب العرض');
  });

  getMyProposals = asyncHandler(async (req: Request, res: Response) => {
    const { page, limit } = getPagination(req);
    const { rows, total } = await this.service.getTechnicianProposals(req.user!.userId, page, limit);
    sendPaginated(res, rows, total, page, limit);
  });
}
