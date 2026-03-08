import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import jwt, { JwtPayload } from 'jsonwebtoken';
import { hashPassword, verifyPassword } from '../../shared/utils/passwordUtils';
import { getAppDataSource } from '../../shared/database/data-source';
import { getTransactionalEntityManager } from '../../shared/database/transactionContext';
import { getAuthenticatedUserData } from '../../shared/auth/authContext';
import { User } from '../users/users.entity';
import { Company } from '../companies/companies.entity';
import { getNewReportCount } from '../notifications/notifications.service';
import { isTokenInvalidated } from '../../shared/auth/tokenInvalidation';
import { SignUpDto, SignInDto, RefreshTokensDto, AuthTokenResponseDto, CheckSessionResponseDto } from './auth.dtos';
import { NotificationsResponseDto } from '../notifications/notifications.dtos';
import { ErrorResponseDto } from '../../shared/errors/errorResponse.dto';

type HttpError = Error & { status: number; code: string };

type RefreshTokenPayload = JwtPayload & {
  sub: string;
  email: string;
  atHash: string;
};

function createHttpError(status: number, message: string, code: string): HttpError {
  return Object.assign(new Error(message), { status, code });
}

function md5Hash(value: string): string {
  return crypto.createHash('md5').update(value).digest('hex');
}

function getAccessSecret(): string {
  if (!process.env.JWT_ACCESS_SECRET) {
    throw createHttpError(500, 'JWT_ACCESS_SECRET is not configured', 'INTERNAL_ERROR');
  }
  return process.env.JWT_ACCESS_SECRET;
}

function getRefreshSecret(): string {
  if (!process.env.JWT_REFRESH_SECRET) {
    throw createHttpError(500, 'JWT_REFRESH_SECRET is not configured', 'INTERNAL_ERROR');
  }
  return process.env.JWT_REFRESH_SECRET;
}

function generateTokenPair(userId: string, role: string, companyId:string): { access_token: string; refresh_token: string } {
  const accessSecret = getAccessSecret();
  const refreshSecret = getRefreshSecret();
  if(!userId){
    throw createHttpError(500, 'User ID is missing', 'INTERNAL_ERROR');
  }
  if(!role){
    throw createHttpError(500, 'User role is missing', 'INTERNAL_ERROR');
  }

  const expirationSecondsAt = process.env.JWT_EXPIRATION ? parseInt(process.env.JWT_EXPIRATION) : 15 * 60;
  const expirationSecondsRt = process.env.JWT_REFRESH_EXPIRATION ? parseInt(process.env.JWT_REFRESH_EXPIRATION) : 7 * 24 * 60 * 60;
  if(!expirationSecondsAt) {
    throw createHttpError(500, 'JWT_EXPIRATION is not configured', 'INTERNAL_ERROR');
  }
  if(!expirationSecondsRt) {
    throw createHttpError(500, 'JWT_REFRESH_EXPIRATION is not configured', 'INTERNAL_ERROR');
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
    throw createHttpError(500, 'JWT_EXPIRATION is not configured', 'INTERNAL_ERROR');
  }
  res.cookie('access_token', accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: expirationSecondsAt * 1000,
  });
}

export async function signUp(req: Request<{}, {}, SignUpDto>, res: Response<AuthTokenResponseDto | ErrorResponseDto>): Promise<void> {
  const { email: rawEmail, password, company } = req.body ?? {};
  const email = String(rawEmail ?? '').trim().toLowerCase();
  if (!email || !password) {
    throw createHttpError(400, 'email and password are required', 'BAD_REQUEST');
  }

  const em = getTransactionalEntityManager();
  const repository = em.getRepository(User);
  const existingUser = await repository.findOneBy({ email });
  if (existingUser) {
    throw createHttpError(409, 'email already registered', 'DUPLICATE_EMAIL');
  }

  const repositoryCompany = em.getRepository(Company);
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

export async function signIn(req: Request<{}, {}, SignInDto>, res: Response<AuthTokenResponseDto | ErrorResponseDto>): Promise<void> {
  const { email: rawEmail, password } = req.body ?? {};
  const email = String(rawEmail ?? '').trim().toLowerCase();
  if (!email || !password) {
    throw createHttpError(400, 'email and password are required', 'BAD_REQUEST');
  }

  const repository = getAppDataSource().getRepository(User);
  const user = await repository.findOneBy({ email });
  if (!user) {
    throw createHttpError(401, 'invalid credentials', 'UNAUTHORIZED');
  }

  const isValidPassword = await verifyPassword(password, user.passwordHash);
  if (!isValidPassword) {
    throw createHttpError(401, 'invalid credentials', 'UNAUTHORIZED');
  }

  const { access_token, refresh_token } = generateTokenPair(user.id, user.role, user.companyId);
  setAccessTokenCookie(res, access_token);
  res.status(200).json({ refresh_token });
}

export async function refreshTokens(req: Request<{}, AuthTokenResponseDto, RefreshTokensDto>, res: Response<AuthTokenResponseDto | ErrorResponseDto>): Promise<void> {
  const { refresh_token } = req.body ?? {};
  if (!refresh_token) {
    throw createHttpError(400, 'refresh_token is required', 'BAD_REQUEST');
  }

  const accessToken = req.cookies?.access_token as string | undefined;
  if (!accessToken) {
    throw createHttpError(401, 'access_token cookie is required', 'UNAUTHORIZED');
  }

  let payload: RefreshTokenPayload;
  try {
    payload = jwt.verify(refresh_token, getRefreshSecret(), { algorithms: ['HS256'] }) as RefreshTokenPayload;
  } catch {
    throw createHttpError(401, 'invalid or expired refresh_token', 'UNAUTHORIZED');
  }

  const accessTokenHash = md5Hash(accessToken);
  if (accessTokenHash !== payload.atHash) {
    throw createHttpError(401, 'token pair mismatch', 'UNAUTHORIZED');
  }

  if (isTokenInvalidated(payload.sub, payload.iat ?? 0)) {
    throw createHttpError(401, 'token has been invalidated', 'UNAUTHORIZED');
  }

  const userRepository = getAppDataSource().getRepository(User);
  const tokenUser = await userRepository.findOneBy({ id: payload.sub });
  if (!tokenUser) {
    throw createHttpError(401, 'user not found', 'UNAUTHORIZED');
  }

  const { access_token, refresh_token: newRefreshToken } = generateTokenPair(tokenUser.id, tokenUser.role, tokenUser.companyId);
  setAccessTokenCookie(res, access_token);
  res.status(200).json({ refresh_token: newRefreshToken });
}

export async function checkSession(req: Request, res: Response<CheckSessionResponseDto | ErrorResponseDto>): Promise<void> {
  const authData = getAuthenticatedUserData();

  const sessionUserRepository = getAppDataSource().getRepository(User);
  const sessionUser = await sessionUserRepository.findOneBy({ id: authData.id });
  if (!sessionUser) {
    throw createHttpError(401, 'user not found', 'UNAUTHORIZED');
  }

  const { access_token, refresh_token } = generateTokenPair(
    authData.id,
    authData.role,
    authData.companyId
  );
  setAccessTokenCookie(res, access_token);

  const decoded = jwt.decode(access_token) as JwtPayload;
  const expiresAt = decoded.exp!;

  res.status(200).json({
    valid: true,
    refresh_token,
    expiresAt,
    user: {
      id: authData.id,
      email: sessionUser.email,
      role: authData.role,
      companyId: authData.companyId,
    },
  });
}

export async function getNotifications(req: Request, res: Response<NotificationsResponseDto | ErrorResponseDto>, next: NextFunction): Promise<void> {
  const { companyId } = getAuthenticatedUserData();
  const count = await getNewReportCount(companyId);
  res.status(200).json({ reportNotificationsData: { totalNew: count } });
}

export function signOut(req: Request, res: Response): void {
  res.clearCookie('access_token', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
  });
  res.status(204).send();
}
