export class AuthModel {
  authId: string;
  password: string;
  name: string;
  phone: string;
  numberOfLogins: number;
  confirmationCode: string;
  createdAt: number;
  confirmationCodeCreatedAt: number;
  deactivatedAt: number;
  deletedAt: number;
  isActive: boolean;
  isAdmin: boolean;
  activationToken: string;
  business: string;

  constructor(data: AuthModel) {
    this.authId = data.authId;
    this.password = data.password;
    this.name = data.name;
    this.phone = data.phone;
    this.numberOfLogins = data.numberOfLogins;
    this.confirmationCode = data.confirmationCode;
    this.createdAt = data.createdAt;
    this.confirmationCodeCreatedAt = data.confirmationCodeCreatedAt;
    this.deactivatedAt = data.deactivatedAt;
    this.deletedAt = data.deletedAt;
    this.isActive = data.isActive;
    this.isAdmin = data.isAdmin || false;
    this.activationToken = data.activationToken;
    this.business = data.business;
  }
}