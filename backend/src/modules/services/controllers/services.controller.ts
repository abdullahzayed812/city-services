import { Request, Response } from 'express';
import { ServicesService } from '../services/services.service';
import { sendSuccess, sendCreated } from '../../../shared/utils/response';
import { asyncHandler } from '../../../shared/middlewares/error.middleware';

export class ServicesController {
  private readonly service: ServicesService;

  constructor() {
    this.service = new ServicesService();
  }

  getAll = asyncHandler(async (req: Request, res: Response) => {
    const categories = await this.service.getCategories();
    sendSuccess(res, categories);
  });

  getOne = asyncHandler(async (req: Request, res: Response) => {
    const category = await this.service.getCategoryById(req.params.id);
    sendSuccess(res, category);
  });

  create = asyncHandler(async (req: Request, res: Response) => {
    const { name_ar, name_en, description_ar, description_en, base_price, sort_order, parent_id } = req.body;
    const category = await this.service.createCategory({
      nameAr: name_ar, nameEn: name_en, descriptionAr: description_ar,
      descriptionEn: description_en, basePrice: base_price, sortOrder: sort_order,
      parentId: parent_id, iconFile: req.file,
    });
    sendCreated(res, category, 'تم إضافة التصنيف بنجاح');
  });

  update = asyncHandler(async (req: Request, res: Response) => {
    const { name_ar, name_en, description_ar, base_price, sort_order, is_active } = req.body;
    await this.service.updateCategory(req.params.id, {
      nameAr: name_ar, nameEn: name_en, descriptionAr: description_ar,
      basePrice: base_price, sortOrder: sort_order,
      isActive: is_active !== undefined ? is_active === 'true' : undefined,
      iconFile: req.file,
    });
    sendSuccess(res, null, 'تم تحديث التصنيف');
  });

  remove = asyncHandler(async (req: Request, res: Response) => {
    await this.service.deleteCategory(req.params.id);
    sendSuccess(res, null, 'تم حذف التصنيف');
  });
}
