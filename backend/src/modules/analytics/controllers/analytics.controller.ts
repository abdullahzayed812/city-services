import { Request, Response } from 'express';
import { AnalyticsService } from '../services/analytics.service';
import { sendSuccess } from '../../../shared/utils/response';
import { asyncHandler } from '../../../shared/middlewares/error.middleware';

export class AnalyticsController {
  private readonly service: AnalyticsService;

  constructor() {
    this.service = new AnalyticsService();
  }

  getKPIs = asyncHandler(async (req: Request, res: Response) => {
    const kpis = await this.service.getDashboardKPIs();
    sendSuccess(res, kpis);
  });

  getRequestsChart = asyncHandler(async (req: Request, res: Response) => {
    const days = parseInt(req.query.days as string) || 30;
    const data = await this.service.getRequestsChart(days);
    sendSuccess(res, data);
  });

  getTopServices = asyncHandler(async (req: Request, res: Response) => {
    const data = await this.service.getTopServices();
    sendSuccess(res, data);
  });

  getTopTechnicians = asyncHandler(async (req: Request, res: Response) => {
    const data = await this.service.getTopTechnicians();
    sendSuccess(res, data);
  });

  getRevenueReport = asyncHandler(async (req: Request, res: Response) => {
    const { from, to } = req.query;
    const data = await this.service.getRevenueReport(
      from as string || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      to as string || new Date().toISOString().split('T')[0]
    );
    sendSuccess(res, data);
  });
}
