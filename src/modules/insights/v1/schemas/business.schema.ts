import {Schema} from 'mongoose';

export const BusinessSchema = new Schema({
  company: {type: String, unique: true, required: true},
  logo: {type: String, required: false},
  name: {type: String, required: true},
  lastName: {type: String, required: false},
  email: {type: String, unique: true, required: true},
  phone: {type: String, required: false}
});
