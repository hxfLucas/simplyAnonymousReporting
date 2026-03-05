import { IsEmail, IsIn, IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator';

export class AddUserDto {
  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(6)
  password!: string;
}

export class UpdateUserPasswordDto {
  @IsString()
  @IsNotEmpty()
  id!: string;

  @IsString()
  @MinLength(6)
  password!: string;
}

export class UpdateOwnSettingsDto {
  @IsString()
  @IsIn(['change_password', 'sign_out_all_devices'])
  action!: 'change_password' | 'sign_out_all_devices';

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  currentPassword?: string;

  @IsOptional()
  @IsString()
  @MinLength(6)
  newPassword?: string;
}

export interface UserResponseDto {
  id: string;
  email: string;
  role: string;
  companyId: string;
  createdAt: Date;
}

export interface ListUsersResponseDto {
  data: UserResponseDto[];
  total: number;
  hasMore: boolean;
}