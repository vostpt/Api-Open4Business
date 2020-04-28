import { IsNotEmpty, IsEmail } from 'class-validator';

export class SignUpModel {
  @IsNotEmpty() @IsEmail() authId: string;
  @IsNotEmpty() name: string;
  password?: string;
  business?: string;
}