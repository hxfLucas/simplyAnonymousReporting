import 'express-serve-static-core';

declare global {
  namespace NodeJS {
    interface ProcessEnv {
      PORT?: string;
      MONGO_URI?: string;
      CORS_ALLOWED_ORIGINS?: string;
      EMAIL_ENABLED?: string;
      JWT_SECRET?: string;
      // SMTP email sending
      ENABLE_SMTP_EMAILS?: string;
      SMTP_HOST?: string;
      SMTP_PORT?: string;
      SMTP_SECURE?: string;
      SMTP_USER?: string;
      SMTP_PASS?: string;
      SMTP_FROM?: string;
    }
  }
}

declare module 'express-serve-static-core' {
  interface Request {
    context?: any;
    user?: { sub: string; email: string; role: string; companyId: string };
  }
}
