import {Schema} from 'mongoose';

export const BatchSchema = new Schema({
  batchId: {type: String, unique: true, required: true},
  businessId: {type: String, required: true},
  personName: {type: String, required: true},
  personEmail: {type: String, required: true},
  personPhone: {type: String, required: false},

  status: {type: String, required: true, default: 'WAITING_FOR_APPROVAL'},
  createdAt: {type: Number, required: true},
  updatedAt: {type: Number, required: true},
  stats: {type: {total: Number, sucess: Number, ignored: Number}, required: true},
});
