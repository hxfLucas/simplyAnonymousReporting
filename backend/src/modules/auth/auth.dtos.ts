import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';

export class SignInDto {
  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(6)
  password!: string;
}

export class SignUpDto {
  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(6)
  password!: string;

  @IsString()
  @IsNotEmpty()
  company!: string;
}

export class RefreshTokensDto {
  @IsString()
  @IsNotEmpty()
  refresh_token!: string;
}

export interface SessionUserResponse {
  id: string;
  email: string;
  role: string;
  companyId: string;
}

export interface CheckSessionResponse {
  valid: true;
  refresh_token: string;
  expiresAt: number;
  user: SessionUserResponse;
}

export interface AuthTokenResponse {
  refresh_token: string;
}
