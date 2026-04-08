import {
  ApiError,
  createError,
  forbiddenError,
  notFoundError,
  duplicateError,
  unauthorizedError,
  badRequestError,
  internalServerError,
} from '../ApiError';

describe('ApiError', () => {
  describe('Constructor', () => {
    it('creates an error with message, code, and status', () => {
      const error = new ApiError('Test error', 'TEST_ERROR', 400);

      expect(error.message).toBe('Test error');
      expect(error.code).toBe('TEST_ERROR');
      expect(error.status).toBe(400);
      expect(error.name).toBe('ApiError');
    });

    it('is an instance of Error', () => {
      const error = new ApiError('Test', 'TEST', 400);
      expect(error instanceof Error).toBe(true);
    });

    it('is an instance of ApiError', () => {
      const error = new ApiError('Test', 'TEST', 400);
      expect(error instanceof ApiError).toBe(true);
    });

    it('preserves prototype chain', () => {
      const error = new ApiError('Test', 'TEST', 400);
      expect(Object.getPrototypeOf(error)).toBe(ApiError.prototype);
    });
  });

  describe('createError', () => {
    it('creates error with custom message, code, and status', () => {
      const error = createError('Custom message', 'CUSTOM_CODE', 418);

      expect(error.message).toBe('Custom message');
      expect(error.code).toBe('CUSTOM_CODE');
      expect(error.status).toBe(418);
    });

    it('returns ApiError instance', () => {
      const error = createError('Test', 'TEST', 400);
      expect(error instanceof ApiError).toBe(true);
    });
  });

  describe('forbiddenError', () => {
    it('creates 403 error with FORBIDDEN code', () => {
      const error = forbiddenError();

      expect(error.status).toBe(403);
      expect(error.code).toBe('FORBIDDEN');
      expect(error.message).toBe('Forbidden');
    });

    it('accepts custom message', () => {
      const error = forbiddenError('User lacks permission');

      expect(error.message).toBe('User lacks permission');
      expect(error.status).toBe(403);
      expect(error.code).toBe('FORBIDDEN');
    });
  });

  describe('notFoundError', () => {
    it('creates 404 error with NOT_FOUND code', () => {
      const error = notFoundError();

      expect(error.status).toBe(404);
      expect(error.code).toBe('NOT_FOUND');
      expect(error.message).toBe('Not found');
    });

    it('accepts custom message', () => {
      const error = notFoundError('User not found');

      expect(error.message).toBe('User not found');
      expect(error.status).toBe(404);
      expect(error.code).toBe('NOT_FOUND');
    });
  });

  describe('duplicateError', () => {
    it('creates 409 error with DUPLICATE code', () => {
      const error = duplicateError();

      expect(error.status).toBe(409);
      expect(error.code).toBe('DUPLICATE');
      expect(error.message).toBe('Resource already exists');
    });

    it('accepts custom message', () => {
      const error = duplicateError('Email already in use');

      expect(error.message).toBe('Email already in use');
      expect(error.status).toBe(409);
      expect(error.code).toBe('DUPLICATE');
    });
  });

  describe('unauthorizedError', () => {
    it('creates 401 error with UNAUTHORIZED code', () => {
      const error = unauthorizedError();

      expect(error.status).toBe(401);
      expect(error.code).toBe('UNAUTHORIZED');
      expect(error.message).toBe('Unauthorized');
    });

    it('accepts custom message', () => {
      const error = unauthorizedError('Token expired');

      expect(error.message).toBe('Token expired');
      expect(error.status).toBe(401);
      expect(error.code).toBe('UNAUTHORIZED');
    });
  });

  describe('badRequestError', () => {
    it('creates 400 error with BAD_REQUEST code', () => {
      const error = badRequestError();

      expect(error.status).toBe(400);
      expect(error.code).toBe('BAD_REQUEST');
      expect(error.message).toBe('Bad request');
    });

    it('accepts custom message', () => {
      const error = badRequestError('Invalid email format');

      expect(error.message).toBe('Invalid email format');
      expect(error.status).toBe(400);
      expect(error.code).toBe('BAD_REQUEST');
    });
  });

  describe('internalServerError', () => {
    it('creates 500 error with INTERNAL_SERVER_ERROR code', () => {
      const error = internalServerError();

      expect(error.status).toBe(500);
      expect(error.code).toBe('INTERNAL_SERVER_ERROR');
      expect(error.message).toBe('Internal server error');
    });

    it('accepts custom message', () => {
      const error = internalServerError('Database connection failed');

      expect(error.message).toBe('Database connection failed');
      expect(error.status).toBe(500);
      expect(error.code).toBe('INTERNAL_SERVER_ERROR');
    });
  });

  describe('Error Consistency', () => {
    it('all errors have status property', () => {
      const errors = [
        forbiddenError(),
        notFoundError(),
        duplicateError(),
        unauthorizedError(),
        badRequestError(),
        internalServerError(),
      ];

      errors.forEach(error => {
        expect(error).toHaveProperty('status');
        expect(typeof error.status).toBe('number');
      });
    });

    it('all errors have code property', () => {
      const errors = [
        forbiddenError(),
        notFoundError(),
        duplicateError(),
        unauthorizedError(),
        badRequestError(),
        internalServerError(),
      ];

      errors.forEach(error => {
        expect(error).toHaveProperty('code');
        expect(typeof error.code).toBe('string');
      });
    });

    it('status codes are in correct HTTP ranges', () => {
      expect(forbiddenError().status).toBeGreaterThanOrEqual(400);
      expect(unauthorizedError().status).toBeGreaterThanOrEqual(400);
      expect(badRequestError().status).toBeGreaterThanOrEqual(400);
      expect(notFoundError().status).toBeGreaterThanOrEqual(400);
      expect(duplicateError().status).toBeGreaterThanOrEqual(400);
      expect(internalServerError().status).toBeGreaterThanOrEqual(500);
    });
  });
});
