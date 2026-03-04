import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class AddUserDto{
  @IsEmail()
  email!: string
}