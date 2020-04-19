import { IsNotEmpty, ValidateIf } from 'class-validator';
export class ChangePasswordModel {
  @IsNotEmpty() password: string;
  @ValidateIf(o => !o.token)
  currentPassword?: string;
  token?: string;
  authId?: string;
}