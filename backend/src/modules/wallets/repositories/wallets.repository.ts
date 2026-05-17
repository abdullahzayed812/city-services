import { v4 as uuidv4 } from 'uuid';
import { PoolConnection } from 'mysql2/promise';
import { db } from '../../../core/database';
import { TransactionType, TransactionStatus } from '../../../shared/types';

export class WalletsRepository {
  async findByUserId(userId: string): Promise<any> {
    const rows = await db.query<any[]>(
      'SELECT * FROM wallets WHERE user_id = ? LIMIT 1',
      [userId]
    );
    return rows[0] || null;
  }

  async credit(userId: string, amount: number, type: TransactionType, description: string, requestId?: string): Promise<void> {
    await db.transaction(async (conn) => {
      const wallet = await this.getForUpdate(userId, conn);
      const newBalance = parseFloat(wallet.balance) + amount;

      await conn.execute(
        'UPDATE wallets SET balance = ?, total_earned = total_earned + ? WHERE user_id = ?',
        [newBalance, amount, userId]
      );

      await conn.execute(
        `INSERT INTO transactions (id, wallet_id, user_id, request_id, type, status, amount,
          balance_before, balance_after, description)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [uuidv4(), wallet.id, userId, requestId || null, type, TransactionStatus.COMPLETED,
         amount, wallet.balance, newBalance, description]
      );
    });
  }

  async debit(userId: string, amount: number, type: TransactionType, description: string, requestId?: string): Promise<void> {
    await db.transaction(async (conn) => {
      const wallet = await this.getForUpdate(userId, conn);

      if (parseFloat(wallet.balance) < amount) {
        throw new Error('رصيد المحفظة غير كافٍ');
      }

      const newBalance = parseFloat(wallet.balance) - amount;

      await conn.execute(
        'UPDATE wallets SET balance = ? WHERE user_id = ?',
        [newBalance, userId]
      );

      await conn.execute(
        `INSERT INTO transactions (id, wallet_id, user_id, request_id, type, status, amount,
          balance_before, balance_after, description)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [uuidv4(), wallet.id, userId, requestId || null, type, TransactionStatus.COMPLETED,
         amount, wallet.balance, newBalance, description]
      );
    });
  }

  private async getForUpdate(userId: string, conn: PoolConnection): Promise<any> {
    const [rows] = await conn.execute(
      'SELECT * FROM wallets WHERE user_id = ? FOR UPDATE',
      [userId]
    );
    return (rows as any[])[0];
  }

  async getTransactions(userId: string, page: number = 1, limit: number = 20): Promise<{ rows: any[]; total: number }> {
    const offset = (page - 1) * limit;
    const [rows, countRows] = await Promise.all([
      db.query<any[]>(
        'SELECT * FROM transactions WHERE user_id = ? ORDER BY created_at DESC LIMIT ? OFFSET ?',
        [userId, limit, offset]
      ),
      db.query<any[]>('SELECT COUNT(*) as total FROM transactions WHERE user_id = ?', [userId]),
    ]);
    return { rows, total: countRows[0].total };
  }

  async getAllTransactions(page: number = 1, limit: number = 20): Promise<{ rows: any[]; total: number }> {
    const offset = (page - 1) * limit;
    const [rows, countRows] = await Promise.all([
      db.query<any[]>(
        `SELECT t.*, u.full_name as user_name, u.phone as user_phone
         FROM transactions t JOIN users u ON t.user_id = u.id
         ORDER BY t.created_at DESC LIMIT ? OFFSET ?`,
        [limit, offset]
      ),
      db.query<any[]>('SELECT COUNT(*) as total FROM transactions'),
    ]);
    return { rows, total: countRows[0].total };
  }

  async createWithdrawalRequest(data: {
    technicianId: string;
    amount: number;
    bankName?: string;
    accountNumber?: string;
    accountHolder?: string;
    instapayNumber?: string;
  }): Promise<string> {
    const id = uuidv4();
    await db.query(
      `INSERT INTO withdrawal_requests (id, technician_id, amount, bank_name, account_number, account_holder, instapay_number)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [id, data.technicianId, data.amount, data.bankName || null, data.accountNumber || null,
       data.accountHolder || null, data.instapayNumber || null]
    );
    return id;
  }

  async getWithdrawalRequests(filters: { userId?: string; status?: string; page?: number; limit?: number }): Promise<{ rows: any[]; total: number }> {
    const page = filters.page || 1;
    const limit = filters.limit || 20;
    const offset = (page - 1) * limit;

    const conditions: string[] = [];
    const params: unknown[] = [];

    if (filters.userId) { conditions.push('wr.technician_id = ?'); params.push(filters.userId); }
    if (filters.status) { conditions.push('wr.status = ?'); params.push(filters.status); }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

    const [rows, countRows] = await Promise.all([
      db.query<any[]>(
        `SELECT wr.*, u.full_name as technician_name, u.phone as technician_phone
         FROM withdrawal_requests wr
         JOIN users u ON wr.technician_id = u.id
         ${where} ORDER BY wr.created_at DESC LIMIT ? OFFSET ?`,
        [...params, limit, offset]
      ),
      db.query<any[]>(`SELECT COUNT(*) as total FROM withdrawal_requests wr ${where}`, params),
    ]);

    return { rows, total: countRows[0].total };
  }

  async processWithdrawal(withdrawalId: string, adminId: string, status: string, note?: string): Promise<void> {
    await db.query(
      'UPDATE withdrawal_requests SET status = ?, admin_note = ?, processed_at = NOW(), processed_by = ? WHERE id = ?',
      [status, note || null, adminId, withdrawalId]
    );
  }
}
