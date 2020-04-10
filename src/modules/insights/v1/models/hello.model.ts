import { IsNotEmpty } from 'class-validator';

export class HelloModel {
  @IsNotEmpty() firstName: string;
  lastName?: string;

  constructor() {
    this.firstName = null;
    this.lastName = null;
  }
}