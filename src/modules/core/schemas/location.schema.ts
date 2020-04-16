import {Schema} from 'mongoose';

export const LocationSchema = new Schema({
  locationId: {type: String, unique: true, required: true},
  company: {type: String, required: true},
  store: {type: String, required: true},
  address: {type: String, required: false},
  parish: {type: String, required: false},
  council: {type: String, required: false},
  district: {type: String, required: false},
  zipCode: {type: String, required: false},
  latitude: {type: Number, required: true},
  longitude: {type: Number, required: true},
  phone: {type: String, required: false},
  sector: {type: String, required: false},
  schedule1: {type: String, required: false},
  schedule1Dow: {type: String, required: false},
  schedule1Type: {type: String, required: false},
  schedule1Period: {type: String, required: false},
  schedule2: {type: String, required: false},
  schedule2Dow: {type: String, required: false},
  schedule2Type: {type: String, required: false},
  schedule2Period: {type: String, required: false},
  schedule3: {type: String, required: false},
  schedule3Dow: {type: String, required: false},
  schedule3Type: {type: String, required: false},
  schedule3Period: {type: String, required: false},
  byAppointment: {type: String, required: false},
  contactForSchedule: {type: String, required: false},
  typeOfService: {type: String, required: false},
  obs: {type: String, required: false}
});