import { RequestHandler } from 'express';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';

export function validateBody<T extends object>(DtoClass: new () => T): RequestHandler {
  return async (req, res, next) => {
    const instance = plainToInstance(DtoClass, req.body as object);
    const errors = await validate(instance as object, { whitelist: true, forbidNonWhitelisted: false });
    if (errors.length > 0) {
      res.status(400).json({
        error: 'Validation failed',
        details: errors.map(e => ({ field: e.property, constraints: e.constraints })),
      });
      return;
    }
    req.body = instance;
    next();
  };
}
