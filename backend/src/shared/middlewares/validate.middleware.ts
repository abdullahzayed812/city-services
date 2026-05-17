import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';
import { ValidationError } from '../errors/AppError';

export const validate = (schema: Joi.ObjectSchema, target: 'body' | 'query' | 'params' = 'body') => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const { error, value } = schema.validate(req[target], {
      abortEarly: false,
      stripUnknown: true,
      errors: { label: 'key', language: 'ar' },
    });

    if (error) {
      const messages = error.details.map((d) => d.message).join(', ');
      throw new ValidationError(messages);
    }

    req[target] = value;
    next();
  };
};
