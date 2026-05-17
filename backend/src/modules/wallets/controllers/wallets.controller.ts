import { Request, Response } from 'express';
import { WalletsService } from '../services/wallets.service';
import { sendSuccess, sendCreated, sendPaginated } from '../../../shared/utils/response';
import { asyncHandler } from '../../../shared/middlewares/error.middleware';
import { getPagination } from '../../../shared/utils/pagination';

export class WalletsController {
  private readonly service: WalletsService;

  constructor() {
    this.service = new WalletsService();
  }

  getWallet = asyncHandler(async (req: Request, res: Response) => {
    const wallet = await this.service.getMyWallet(req.user!.userId);
    sendSuccess(res, wallet);
  });

  getTransactions = asyncHandler(async (req: Request, res: Response) => {
    const { page, limit } = getPagination(req);
    const { rows, total } = await this.service.getMyTransactions(req.user!.userId, page, limit);
    sendPaginated(res, rows, total, page, limit);
  });

  requestWithdrawal = asyncHandler(async (req: Request, res: Response) => {
    const { amount, bank_name, account_number, account_holder, instapay_number } = req.body;
    const result = await this.service.requestWithdrawal(req.user!.userId, {
      amount: parseFloat(amount),
      bankName: bank_name,
      accountNumber: account_number,
      accountHolder: account_holder,
      instapayNumber: instapay_number,
    });
    sendCreated(res, result, 'تم تقديم طلب السحب بنجاح');
  });

  getMyWithdrawals = asyncHandler(async (req: Request, res: Response) => {
    const { page, limit } = getPagination(req);
    const { rows, total } = await this.service.getMyWithdrawals(req.user!.userId, page, limit);
    sendPaginated(res, rows, total, page, limit);
  });

  getAdminTransactions = asyncHandler(async (req: Request, res: Response) => {
    const { page, limit } = getPagination(req);
    const { rows, total } = await this.service.getAllTransactions(page, limit);
    sendPaginated(res, rows, total, page, limit);
  });

  getAdminWithdrawals = asyncHandler(async (req: Request, res: Response) => {
    const { page, limit } = getPagination(req);
    const { status } = req.query;
    const { rows, total } = await this.service.getAllWithdrawals({ status, page, limit });
    sendPaginated(res, rows, total, page, limit);
  });

  approveWithdrawal = asyncHandler(async (req: Request, res: Response) => {
    await this.service.processWithdrawal(req.params.id, req.user!.userId, true, req.body.note);
    sendSuccess(res, null, 'تم الموافقة على طلب السحب');
  });

  rejectWithdrawal = asyncHandler(async (req: Request, res: Response) => {
    await this.service.processWithdrawal(req.params.id, req.user!.userId, false, req.body.reason);
    sendSuccess(res, null, 'تم رفض طلب السحب');
  });
}
