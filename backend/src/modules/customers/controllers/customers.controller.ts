import { Request, Response } from 'express';
import { CustomersService } from '../services/customers.service';
import { sendPaginated, sendSuccess, sendCreated } from '../../../shared/utils/response';
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

  getAddresses = asyncHandler(async (req: Request, res: Response) => {
    const addresses = await this.service.getAddresses(req.user!.userId);
    sendSuccess(res, addresses);
  });

  addAddress = asyncHandler(async (req: Request, res: Response) => {
    const { label, address, latitude, longitude } = req.body;
    const created = await this.service.addAddress(req.user!.userId, { label, address, latitude, longitude });
    sendCreated(res, created, 'تم إضافة العنوان بنجاح');
  });

  updateAddress = asyncHandler(async (req: Request, res: Response) => {
    const { label, address } = req.body;
    const updated = await this.service.updateAddress(req.user!.userId, req.params.id, { label, address });
    sendSuccess(res, updated, 'تم تحديث العنوان بنجاح');
  });

  deleteAddress = asyncHandler(async (req: Request, res: Response) => {
    await this.service.deleteAddress(req.user!.userId, req.params.id);
    sendSuccess(res, null, 'تم حذف العنوان بنجاح');
  });
}
