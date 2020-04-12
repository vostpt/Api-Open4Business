export class BusinessModel {
  company: string;
  logo: string;
  name: string;
  lastName: string;
  email: string;
  phone: string;

  dataFile: string;
  
  constructor() {
    this.company = null;
    this.logo = null;
    this.name = null;
    this.lastName = null;
    this.email = null;
    this.phone = null;
  }
}