export class LocationModel {
  locationId: string;
  company: string;
  store: string;
  address: string;
  fregesia: string;
  concelho: string;
  district: string;
  zipCode: string;
  latitude: number;
  longitude: number;
  phone: string;
  sector: string;

  schedule1: string;
  schedule1Dow: string;
  schedule1Type: string;

  schedule2: string;
  schedule2Dow: string;
  schedule2Type: string;

  schedule3: string;
  schedule3Dow: string;
  schedule3Type: string;

  constructor() {
    this.locationId = null;
    this.company = null;
    this.store = null;
    this.address = null;
    this.fregesia = null;
    this.concelho = null;
    this.district = null;
    this.zipCode = null;
    this.latitude = 0;
    this.longitude = 0;
    this.phone = null;
    this.sector = null;

    this.schedule1 = null;
    this.schedule1Dow = null;
    this.schedule1Type = null;

    this.schedule2 = null;
    this.schedule2Dow = null;
    this.schedule2Type = null;

    this.schedule3 = null;
    this.schedule3Dow = null;
    this.schedule3Type = null;
  }
}