import { Request, Response } from 'express';
import { CustomersService } from '../services/customers.service';
import { sendPaginated } from '../../../shared/utils/response';
import { asyncHandler } from '../../../shared/middlewares/error.middleware';
import { getPagination } from '../../../shared/utils/pagination';

export class CustomersController {
  private readonly service = new CustomersService();

  getAll = asyncHandler(async (req: Request, res: Response) => {
    const { page, limit } = getPagination(req);
    const { search } = req.query;
    const { rows, total } = await this.service.getAll({ search: search as string, page, limit });
    sendPaginated(res, rows, total, page, limit);
  });
}
