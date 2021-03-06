import {Schema} from 'mongoose';

export const BusinessSchema = new Schema({
  businessId: {type: String, unique: true, required: true},
  company: {type: String, unique: true, required: true},
  companyType: {type: String, required: true},
  logo: {type: String, required: false},
  name: {type: String, required: true},
  email: {type: String, unique: true, required: true},
  phone: {type: String, required: false}
});
