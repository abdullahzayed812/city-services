import { Request } from 'express';
import { PaginationParams } from '../types';

export const getPagination = (req: Request): PaginationParams => {
  const page = Math.max(1, parseInt(req.query.page as string) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 20));
  return { page, limit };
};

export const getOffset = (page: number, limit: number): number => (page - 1) * limit;
