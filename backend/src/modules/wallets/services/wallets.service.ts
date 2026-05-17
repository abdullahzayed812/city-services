import { WalletsRepository } from '../repositories/wallets.repository';
import { NotFoundError, BadRequestError } from '../../../shared/errors/AppError';
import { TransactionType } from '../../../shared/types';

export class WalletsService {
  private readonly repo: WalletsRepository;

  constructor() {
    this.repo = new WalletsRepository();
  }

  async getMyWallet(userId: string): Promise<object> {
    const wallet = await this.repo.findByUserId(userId);
    if (!wallet) throw new NotFoundError('المحفظة');
    return wallet;
  }

  async getMyTransactions(userId: string, page: number, limit: number) {
    return this.repo.getTransactions(userId, page, limit);
  }

  async requestWithdrawal(technicianId: string, data: {
    amount: number;
    bankName?: string;
    accountNumber?: string;
    accountHolder?: string;
    instapayNumber?: string;
  }): Promise<object> {
    const wallet = await this.repo.findByUserId(technicianId);
    if (!wallet) throw new NotFoundError('المحفظة');

    if (parseFloat(wallet.balance) < data.amount) {
      throw new BadRequestError('رصيد المحفظة غير كافٍ');
    }

    if (data.amount < 50) {
      throw new BadRequestError('الحد الأدنى للسحب هو 50 جنيه');
    }

    // Reserve the amount
    await this.repo.debit(
      technicianId,
      data.amount,
      TransactionType.WITHDRAWAL,
      `طلب سحب ${data.amount} جنيه`
    );

    const withdrawalId = await this.repo.createWithdrawalRequest({ technicianId, ...data });
    return { id: withdrawalId, amount: data.amount, status: 'pending' };
  }

  async getMyWithdrawals(userId: string, page: number, limit: number) {
    return this.repo.getWithdrawalRequests({ userId, page, limit });
  }

  async getAllTransactions(page: number, limit: number) {
    return this.repo.getAllTransactions(page, limit);
  }

  async getAllWithdrawals(filters: object) {
    return this.repo.getWithdrawalRequests(filters as any);
  }

  async processWithdrawal(withdrawalId: string, adminId: string, approved: boolean, note?: string): Promise<void> {
    const status = approved ? 'approved' : 'rejected';
    await this.repo.processWithdrawal(withdrawalId, adminId, status, note);
  }
}
