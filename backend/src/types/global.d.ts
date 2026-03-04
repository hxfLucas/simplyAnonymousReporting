import 'express-serve-static-core';

declare global {
  namespace NodeJS {
    interface ProcessEnv {
      PORT?: string;
      MONGO_URI?: string;
      CORS_ALLOWED_ORIGINS?: string;
      EMAIL_ENABLED?: string;
      JWT_SECRET?: string;
    }
  }
}

declare module 'express-serve-static-core' {
  interface Request {
    context?: any;
    user?: { sub: string; email: string; role: string };
  }
}
