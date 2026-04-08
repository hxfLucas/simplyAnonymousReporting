import errorHandler from '../errorHandler';
import { ApiError } from '../../errors/ApiError';
import type { NextFunction, Request, Response } from 'express';

// Mock Express types
const mockRequest = {} as Request;
const mockNext = jest.fn() as NextFunction;

describe('errorHandler Middleware', () => {
  let mockResponse: Partial<Response>;

  beforeEach(() => {
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    jest.clearAllMocks();
  });

  describe('with ApiError instance', () => {
    it('uses error.status and returns error message', () => {
      const apiError = new ApiError('Forbidden action', 'FORBIDDEN', 403);

      errorHandler(apiError, mockRequest, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(403);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: 'Forbidden action',
      });
    });

    it('handles 404 errors correctly', () => {
      const apiError = new ApiError('Resource not found', 'NOT_FOUND', 404);

      errorHandler(apiError, mockRequest, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: 'Resource not found',
      });
    });

    it('handles 500 errors correctly', () => {
      const apiError = new ApiError('Internal server error', 'INTERNAL_SERVER_ERROR', 500);

      errorHandler(apiError, mockRequest, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: 'Internal server error',
      });
    });
  });

  describe('with plain Error object', () => {
    it('defaults to 500 status when error has no status', () => {
      const plainError = new Error('Something went wrong');

      errorHandler(plainError, mockRequest, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: 'Something went wrong',
      });
    });
  });

  describe('with errors without message', () => {
    it('returns default message when err.message is missing', () => {
      const errorObj = { status: 400 };

      errorHandler(errorObj, mockRequest, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: 'Internal Server Error',
      });
    });

    it('logs to console when SHOW_UNHANDLED_ERRORS_IN_CONSOLE is true', () => {
      const originalEnv = process.env.SHOW_UNHANDLED_ERRORS_IN_CONSOLE;
      process.env.SHOW_UNHANDLED_ERRORS_IN_CONSOLE = 'true';

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      const errorObj = { status: 500 };

      errorHandler(errorObj, mockRequest, mockResponse as Response, mockNext);

      expect(consoleSpy).toHaveBeenCalledWith('Unhandled error handler:', errorObj);
      consoleSpy.mockRestore();
      process.env.SHOW_UNHANDLED_ERRORS_IN_CONSOLE = originalEnv;
    });

    it('does not log to console when SHOW_UNHANDLED_ERRORS_IN_CONSOLE is false', () => {
      const originalEnv = process.env.SHOW_UNHANDLED_ERRORS_IN_CONSOLE;
      process.env.SHOW_UNHANDLED_ERRORS_IN_CONSOLE = 'false';

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      const errorObj = { status: 500 };

      errorHandler(errorObj, mockRequest, mockResponse as Response, mockNext);

      expect(consoleSpy).not.toHaveBeenCalled();
      consoleSpy.mockRestore();
      process.env.SHOW_UNHANDLED_ERRORS_IN_CONSOLE = originalEnv;
    });
  });

  describe('with null/undefined errors', () => {
    it('handles null error', () => {
      errorHandler(null, mockRequest, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: 'Internal Server Error',
      });
    });

    it('handles undefined error', () => {
      errorHandler(undefined, mockRequest, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: 'Internal Server Error',
      });
    });
  });

  describe('status code handling', () => {
    it('defaults to 500 when status is not provided', () => {
      const errorObj = { message: 'Test error' };

      errorHandler(errorObj, mockRequest, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(500);
    });

    it('uses provided status code', () => {
      const errorObj = { message: 'Test error', status: 418 };

      errorHandler(errorObj, mockRequest, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(418);
    });

    it('handles various HTTP status codes', () => {
      const statuses = [400, 401, 403, 404, 409, 500, 503];

      statuses.forEach(status => {
        mockResponse.status = jest.fn().mockReturnThis();
        mockResponse.json = jest.fn().mockReturnThis();

        const errorObj = { message: 'Test error', status };
        errorHandler(errorObj, mockRequest, mockResponse as Response, mockNext);

        expect(mockResponse.status).toHaveBeenCalledWith(status);
      });
    });
  });

  describe('response format', () => {
    it('always returns JSON with message field', () => {
      const errorObj = { message: 'Test error', status: 400 };

      errorHandler(errorObj, mockRequest, mockResponse as Response, mockNext);

      const jsonCall = (mockResponse.json as jest.Mock).mock.calls[0][0];
      expect(jsonCall).toHaveProperty('message');
      expect(typeof jsonCall.message).toBe('string');
    });

    it('does not leak error stack or internal details', () => {
      const errorObj = {
        message: 'Test error',
        status: 400,
        stack: 'some/stack/trace',
        code: 'INTERNAL_CODE',
        internals: { secret: 'data' },
      };

      errorHandler(errorObj, mockRequest, mockResponse as Response, mockNext);

      const jsonCall = (mockResponse.json as jest.Mock).mock.calls[0][0];
      expect(jsonCall).not.toHaveProperty('stack');
      expect(jsonCall).not.toHaveProperty('code');
      expect(jsonCall).not.toHaveProperty('internals');
    });
  });
});
