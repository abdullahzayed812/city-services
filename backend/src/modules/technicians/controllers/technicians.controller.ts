import { Request, Response } from 'express';
import { TechniciansService } from '../services/technicians.service';
import { sendSuccess, sendPaginated } from '../../../shared/utils/response';
import { asyncHandler } from '../../../shared/middlewares/error.middleware';
import { getPagination } from '../../../shared/utils/pagination';
import { TechnicianAvailability } from '../../../shared/types';

export class TechniciansController {
  private readonly service: TechniciansService;

  constructor() {
    this.service = new TechniciansService();
  }

  getProfile = asyncHandler(async (req: Request, res: Response) => {
    const id = req.params.id || req.user!.userId;
    const profile = await this.service.getProfile(id);
    sendSuccess(res, profile);
  });

  updateProfile = asyncHandler(async (req: Request, res: Response) => {
    const avatar = req.file;
    const { full_name, bio, years_experience, coverage_radius_km } = req.body;
    await this.service.updateProfile(req.user!.userId, {
      fullName: full_name, bio, yearsExperience: years_experience, coverageRadiusKm: coverage_radius_km, avatar,
    });
    sendSuccess(res, null, 'تم تحديث الملف الشخصي بنجاح');
  });

  updateAvailability = asyncHandler(async (req: Request, res: Response) => {
    const { availability } = req.body;
    await this.service.updateAvailability(req.user!.userId, availability as TechnicianAvailability);
    sendSuccess(res, null, 'تم تحديث حالة التوفر');
  });

  updateLocation = asyncHandler(async (req: Request, res: Response) => {
    const { latitude, longitude } = req.body;
    await this.service.updateLocation(req.user!.userId, parseFloat(latitude), parseFloat(longitude));
    sendSuccess(res, null, 'تم تحديث الموقع');
  });

  uploadIdDocument = asyncHandler(async (req: Request, res: Response) => {
    const files = req.files as { [fieldname: string]: Express.Multer.File[] };
    const frontFile = files['front']?.[0];
    const backFile = files['back']?.[0];
    if (!frontFile) throw new Error('يجب رفع صورة واجهة الهوية');
    await this.service.uploadIdDocument(req.user!.userId, frontFile, backFile);
    sendSuccess(res, null, 'تم رفع المستندات بنجاح');
  });

  addService = asyncHandler(async (req: Request, res: Response) => {
    const { category_id, categoryId, price_from, price_to } = req.body;
    await this.service.addService(req.user!.userId, category_id ?? categoryId, price_from, price_to);
    sendSuccess(res, null, 'تم إضافة التخصص');
  });

  removeService = asyncHandler(async (req: Request, res: Response) => {
    await this.service.removeService(req.user!.userId, req.params.categoryId);
    sendSuccess(res, null, 'تم حذف التخصص');
  });

  getMyPortfolio = asyncHandler(async (req: Request, res: Response) => {
    const images = await this.service.getPortfolio(req.user!.userId);
    sendSuccess(res, images);
  });

  addPortfolioImage = asyncHandler(async (req: Request, res: Response) => {
    if (!req.file) throw new Error('يجب رفع صورة');
    const image = await this.service.addPortfolioImage(req.user!.userId, req.file, req.body.caption);
    sendSuccess(res, image, 'تم رفع الصورة');
  });

  deletePortfolioImage = asyncHandler(async (req: Request, res: Response) => {
    await this.service.deletePortfolioImage(req.user!.userId, req.params.imageId);
    sendSuccess(res, null, 'تم حذف الصورة');
  });

  getMyDocuments = asyncHandler(async (req: Request, res: Response) => {
    const docs = await this.service.getDocuments(req.user!.userId);
    sendSuccess(res, docs); // returns array: [{type, url, status}]
  });

  getMyServices = asyncHandler(async (req: Request, res: Response) => {
    const services = await this.service.getServices(req.user!.userId);
    sendSuccess(res, services);
  });

  getAll = asyncHandler(async (req: Request, res: Response) => {
    const { page, limit } = getPagination(req);
    const { category_id, availability, verification_status, search } = req.query;
    const { rows, total } = await this.service.getAll({
      categoryId: category_id as string,
      availability: availability as string,
      verificationStatus: verification_status as string,
      search: search as string,
      page, limit,
    });
    sendPaginated(res, rows, total, page, limit);
  });

  approve = asyncHandler(async (req: Request, res: Response) => {
    await this.service.approveTechnician(req.params.id, req.user!.userId);
    sendSuccess(res, null, 'تم تفعيل حساب الفني');
  });

  reject = asyncHandler(async (req: Request, res: Response) => {
    await this.service.rejectTechnician(req.params.id, req.user!.userId, req.body.reason);
    sendSuccess(res, null, 'تم رفض طلب الفني');
  });
}
