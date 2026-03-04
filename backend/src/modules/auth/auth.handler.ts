import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import jwt, { JwtPayload } from 'jsonwebtoken';
import { getAppDataSource } from '../../shared/database/data-source';
import { getAuthenticatedUserData } from '../../shared/auth/authContext';
import { User } from '../users/users.entity';
import { Company } from '../companies/companies.entity';
import { Report } from '../reports/reports.entity';

type HttpError = Error & { status: number };

type RefreshTokenPayload = JwtPayload & {
  sub: string;
  email: string;
  atHash: string;
};

function createHttpError(status: number, message: string): HttpError {
  return Object.assign(new Error(message), { status });
}

function md5Hash(value: string): string {
  return crypto.createHash('md5').update(value).digest('hex');
}

function getAccessSecret(): string {
  if (!process.env.JWT_SECRET) {
    throw createHttpError(500, 'JWT_SECRET is not configured');
  }
  return process.env.JWT_SECRET;
}

function getRefreshSecret(): string {
  if (!process.env.JWT_SECRET) {
    throw createHttpError(500, 'JWT_SECRET is not configured');
  }
  return process.env.JWT_SECRET;
}

function hashPassword(password: string): Promise<string> {
  const salt = crypto.randomBytes(16).toString('hex');
  return new Promise((resolve, reject) => {
    crypto.scrypt(password, salt, 64, (error, derivedKey) => {
      if (error) {
        reject(error);
        return;
      }
      resolve(`${salt}:${derivedKey.toString('hex')}`);
    });
  });
}

function verifyPassword(password: string, storedHash: string): Promise<boolean> {
  const parts = storedHash.split(':');
  if (parts.length !== 2) {
    return Promise.resolve(false);
  }

  const [salt, expectedHash] = parts;
  return new Promise((resolve, reject) => {
    crypto.scrypt(password, salt, 64, (error, derivedKey) => {
      if (error) {
        reject(error);
        return;
      }

      try {
        const expectedBuffer = Buffer.from(expectedHash, 'hex');
        const derivedBuffer = Buffer.from(derivedKey.toString('hex'), 'hex');
        if (expectedBuffer.length !== derivedBuffer.length) {
          resolve(false);
          return;
        }
        resolve(crypto.timingSafeEqual(derivedBuffer, expectedBuffer));
      } catch {
        resolve(false);
      }
    });
  });
}

function generateTokenPair(userId: string, role: string, companyId:string): { access_token: string; refresh_token: string } {
  const accessSecret = getAccessSecret();
  const refreshSecret = getRefreshSecret();
  if(!userId){
    throw createHttpError(500, 'User ID is missing');
  }
  if(!role){
    throw createHttpError(500, 'User role is missing');
  }

  const expirationSecondsAt = process.env.JWT_EXPIRATION ? parseInt(process.env.JWT_EXPIRATION) : 15 * 60;
  const expirationSecondsRt = process.env.JWT_REFRESH_EXPIRATION ? parseInt(process.env.JWT_REFRESH_EXPIRATION) : 7 * 24 * 60 * 60;
  if(!expirationSecondsAt) {
    throw createHttpError(500, 'JWT_EXPIRATION is not configured');
  }
  if(!expirationSecondsRt) {
    throw createHttpError(500, 'JWT_REFRESH_EXPIRATION is not configured');
  }
  const access_token = jwt.sign(
    { sub: userId, role:role, companyId:companyId },
    accessSecret,
    { algorithm: 'HS256', expiresIn: `${expirationSecondsAt}s` }
  );

  const atHash = md5Hash(access_token);

  const refresh_token = jwt.sign(
    { sub: userId, atHash },
    refreshSecret,
    { algorithm: 'HS256', expiresIn: `${expirationSecondsRt}s` }
  );

  return { access_token, refresh_token };
}

function setAccessTokenCookie(res: Response, accessToken: string): void {
  const expirationSecondsAt = process.env.JWT_EXPIRATION ? parseInt(process.env.JWT_EXPIRATION) : 0;
  if(!expirationSecondsAt){
    throw createHttpError(500, 'JWT_EXPIRATION is not configured');
  }
  res.cookie('access_token', accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: expirationSecondsAt * 1000,
  });
}

export async function signUp(req: Request, res: Response): Promise<void> {
  const { email: rawEmail, password, company } = req.body ?? {};
  const email = String(rawEmail ?? '').trim().toLowerCase();
  if (!email || !password) {
    throw createHttpError(400, 'email and password are required');
  }

  const repository = getAppDataSource().getRepository(User);
  const existingUser = await repository.findOneBy({ email });
  if (existingUser) {
    throw createHttpError(409, 'email already registered');
  }

  const repositoryCompany = getAppDataSource().getRepository(Company);
  const newCompany = repositoryCompany.create({ name: company });
  const savedCompany = await repositoryCompany.save(newCompany);

  const companyId = savedCompany.id;
  const passwordHash = await hashPassword(password);
  const roleToAssign = "admin";
  const user = repository.create({ email, passwordHash, role: roleToAssign, company: savedCompany });
  await repository.save(user);

  const { access_token, refresh_token } = generateTokenPair(user.id, roleToAssign, companyId);
  setAccessTokenCookie(res, access_token);
  res.status(201).json({ refresh_token });
}

export async function signIn(req: Request, res: Response): Promise<void> {
  const { email: rawEmail, password } = req.body ?? {};
  const email = String(rawEmail ?? '').trim().toLowerCase();
  if (!email || !password) {
    throw createHttpError(400, 'email and password are required');
  }

  const repository = getAppDataSource().getRepository(User);
  const user = await repository.findOneBy({ email });
  if (!user) {
    throw createHttpError(401, 'invalid credentials');
  }

  const isValidPassword = await verifyPassword(password, user.passwordHash);
  if (!isValidPassword) {
    throw createHttpError(401, 'invalid credentials');
  }

  const { access_token, refresh_token } = generateTokenPair(user.id, user.role, user.companyId);
  setAccessTokenCookie(res, access_token);
  res.status(200).json({ refresh_token });
}

export async function refreshTokens(req: Request, res: Response): Promise<void> {
  const { refresh_token } = req.body ?? {};
  if (!refresh_token) {
    throw createHttpError(400, 'refresh_token is required');
  }

  const accessToken = req.cookies?.access_token as string | undefined;
  if (!accessToken) {
    throw createHttpError(401, 'access_token cookie is required');
  }

  let payload: RefreshTokenPayload;
  try {
    payload = jwt.verify(refresh_token, getRefreshSecret(), { algorithms: ['HS256'] }) as RefreshTokenPayload;
  } catch {
    throw createHttpError(401, 'invalid or expired refresh_token');
  }

  const accessTokenHash = md5Hash(accessToken);
  if (accessTokenHash !== payload.atHash) {
    throw createHttpError(401, 'token pair mismatch');
  }

  const { access_token, refresh_token: newRefreshToken } = generateTokenPair(payload.sub, payload.role, payload.companyId);
  setAccessTokenCookie(res, access_token);
  res.status(200).json({ refresh_token: newRefreshToken });
}

export async function checkSession(req: Request, res: Response): Promise<void> {
  const payload = req.user as JwtPayload | undefined;
  if (!payload?.sub) {
    throw createHttpError(401, 'unauthorized');
  }

  const { access_token, refresh_token } = generateTokenPair(
    payload.sub,
    payload.role,
    payload.companyId
  );
  setAccessTokenCookie(res, access_token);

  res.status(200).json({
    valid: true,
    refresh_token,
    user: {
      id: payload.sub,
      email: payload.email,
      role: payload.role,
      companyId: payload.companyId,
    },
  });
}

export async function getNotifications(req: Request, res: Response, next: NextFunction): Promise<void> {
  const { companyId } = getAuthenticatedUserData();
  const count = await getAppDataSource().getRepository(Report).count({ where: { companyId, status: 'new' } });
  res.status(200).json({ reportNotificationsData: { totalNew: count } });
}
