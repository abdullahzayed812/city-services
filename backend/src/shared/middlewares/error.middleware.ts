import { Request, Response, NextFunction } from 'express';
import { AppError } from '../errors/AppError';
import { logger } from '../../core/logger';
import { config } from '../../config';

export const errorHandler = (
  error: Error,
  req: Request,
  res: Response,
  _next: NextFunction
): void => {
  logger.error(`[${req.method}] ${req.path} - ${error.message}`, {
    stack: error.stack,
    body: req.body,
  });

  if (error instanceof AppError) {
    res.status(error.statusCode).json({
      success: false,
      message: error.message,
      code: error.code,
      ...(config.env === 'development' && { stack: error.stack }),
    });
    return;
  }

  // MySQL Errors
  if ((error as any).code === 'ER_DUP_ENTRY') {
    res.status(409).json({
      success: false,
      message: 'البيانات موجودة مسبقاً',
      code: 'DUPLICATE_ENTRY',
    });
    return;
  }

  // Multer Errors
  if (error.name === 'MulterError') {
    res.status(400).json({
      success: false,
      message: 'خطأ في رفع الملف',
      code: 'FILE_UPLOAD_ERROR',
    });
    return;
  }

  // Default 500
  res.status(500).json({
    success: false,
    message: 'حدث خطأ غير متوقع في الخادم',
    code: 'INTERNAL_ERROR',
    ...(config.env === 'development' && { stack: error.stack }),
  });
};

export const notFoundHandler = (req: Request, res: Response): void => {
  res.status(404).json({
    success: false,
    message: `المسار ${req.method} ${req.path} غير موجود`,
    code: 'ROUTE_NOT_FOUND',
  });
};

export const asyncHandler = (
  fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>
) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};
