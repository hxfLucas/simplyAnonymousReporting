/**
 * Factory function for creating standardized API errors
 * Errors include both a human-readable message and a machine-readable code
 */

export class ApiError extends Error {
  public readonly status: number;
  public readonly code: string;

  constructor(message: string, code: string, status: number) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.status = status;

    // Maintain proper prototype chain for instanceof checks
    Object.setPrototypeOf(this, ApiError.prototype);
  }
}

/**
 * Common error factory functions for consistent error responses
 */
export const createError = (message: string, code: string, status: number): ApiError => {
  return new ApiError(message, code, status);
};

export const forbiddenError = (message: string = 'Forbidden'): ApiError => {
  return createError(message, 'FORBIDDEN', 403);
};

export const notFoundError = (message: string = 'Not found'): ApiError => {
  return createError(message, 'NOT_FOUND', 404);
};

export const duplicateError = (message: string = 'Resource already exists'): ApiError => {
  return createError(message, 'DUPLICATE', 409);
};

export const unauthorizedError = (message: string = 'Unauthorized'): ApiError => {
  return createError(message, 'UNAUTHORIZED', 401);
};

export const badRequestError = (message: string = 'Bad request'): ApiError => {
  return createError(message, 'BAD_REQUEST', 400);
};

export const internalServerError = (message: string = 'Internal server error'): ApiError => {
  return createError(message, 'INTERNAL_SERVER_ERROR', 500);
};
