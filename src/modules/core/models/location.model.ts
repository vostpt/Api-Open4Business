export class LocationModel {
  locationId: string;
  businessId: string;
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
  schedule1Period: string;

  schedule2: string;
  schedule2Dow: string;
  schedule2Type: string;
  schedule2Period: string;

  schedule3: string;
  schedule3Dow: string;
  schedule3Type: string;
  schedule3Period: string;

  byAppointment: string;
  contactForSchedule: string;
  typeOfService: string;
  obs: string;
  audit: object;
}