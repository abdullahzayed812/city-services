import { Response } from 'express';
import { ApiResponse } from '../types';

export const sendSuccess = <T>(
  res: Response,
  data: T,
  message: string = 'تمت العملية بنجاح',
  statusCode: number = 200,
  meta?: Record<string, unknown>
): Response => {
  const response: ApiResponse<T> = { success: true, message, data, meta };
  return res.status(statusCode).json(response);
};

export const sendCreated = <T>(
  res: Response,
  data: T,
  message: string = 'تم الإنشاء بنجاح'
): Response => sendSuccess(res, data, message, 201);

export const sendError = (
  res: Response,
  message: string,
  statusCode: number = 500,
  errors?: string[]
): Response => {
  const response: ApiResponse = { success: false, message, errors };
  return res.status(statusCode).json(response);
};

export const sendPaginated = <T>(
  res: Response,
  data: T[],
  total: number,
  page: number,
  limit: number,
  message: string = 'تم جلب البيانات بنجاح'
): Response => {
  return sendSuccess(res, data, message, 200, {
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  });
};
