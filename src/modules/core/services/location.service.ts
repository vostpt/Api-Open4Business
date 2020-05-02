import {Injectable, Logger} from '@nestjs/common';
import {InjectModel} from '@nestjs/mongoose';
import {Model} from 'mongoose';

import {LocationModel} from '../models/location.model';
import { BusinessModel } from '../models/business.model';

@Injectable()
export class LocationService {
  constructor(
      @InjectModel('Location') private readonly locationModel: Model<LocationModel>, 
      @InjectModel('Business') private readonly businessModel: Model<BusinessModel>, 
      private readonly logger: Logger
  ) {}

  validateStringField(value) {
    if (value == null || value == undefined || value.trim() == '') {
      return false;
    }

    return true;
  }

  isValid(location: LocationModel) {
    if (!this.validateStringField(location.locationId)) {
      return false;
    }
    if (!this.validateStringField(location.company)) {
      return false;
    }
    if (!this.validateStringField(location.store)) {
      return false;
    }
    if (!this.validateStringField(location.longitude)) {
      return false;
    }
    if (!this.validateStringField(location.latitude)) {
      return false;
    }

    return true;
  }

  hasSchedule(location: LocationModel) {
    if (this.validateStringField(location.schedule1) &&
        this.validateStringField(location.schedule1Dow)) {
      return true;
    }

    if (this.validateStringField(location.schedule2) &&
        this.validateStringField(location.schedule2Dow)) {
      return true;
    }

    if (this.validateStringField(location.schedule3) &&
        this.validateStringField(location.schedule3Dow)) {
      return true;
    }

    return false;
  }

  async createLocation(data: LocationModel): Promise<LocationModel> {
    this.logger.setContext(LocationService.name);

    const location = await this.locationModel(data);
    return location.save();
  }

  async findLocation(body) {
    return this.locationModel.findOne(body).exec();
  }

  async updateLocation(businessId: string, location: LocationModel) {
    const _location =
        await this.locationModel
            .findOne({locationId: location.locationId, businessId})
            .exec();

    if (!_location) {
      throw {message: 'Location not found'};
    }

    // Update fields
    _location.isOpen = location.isOpen;
    _location.company = location.company;
    _location.store = location.store;
    _location.address = location.address;
    _location.parish = location.parish;
    _location.council = location.council;
    _location.district = location.district;
    _location.zipCode = location.zipCode;
    _location.latitude = location.latitude;
    _location.longitude = location.longitude;
    _location.phone = location.phone;
    _location.sector = location.sector;

    _location.schedule1 = location.schedule1;
    _location.schedule1Dow = location.schedule1Dow;
    _location.schedule1Type = location.schedule1Type;
    _location.schedule1Period = location.schedule1Period;

    _location.schedule2 = location.schedule2;
    _location.schedule2Dow = location.schedule2Dow;
    _location.schedule2Type = location.schedule2Type;
    _location.schedule2Period = location.schedule2Period;

    _location.schedule3 = location.schedule3;
    _location.schedule3Dow = location.schedule3Dow;
    _location.schedule3Type = location.schedule3Type;
    _location.schedule3Period = location.schedule3Period;

    _location.byAppointment = location.byAppointment;
    _location.contactForSchedule = location.contactForSchedule;
    _location.typeOfService = location.typeOfService;
    _location.obs = location.obs;
    _location.external = {...(_location.external || {}), ...location.external};
    _location.audit.updatedAt = Math.round(+new Date() / 1000);

    return _location.save();
  }

  async countLocations(filter) {
    return this.locationModel.countDocuments(filter).exec();
  }

  async getLocationsWithPagination(filter, limit: number, offset: number) {
    return this.locationModel.find(filter)
        .populate('business')
        .sort('store')
        .limit(limit)
        .skip(offset)
        .exec();
  }

  async getLocations(filter) {
    return this.locationModel.find(filter).exec();
  }

  async getSectors(filter) {
    return this.locationModel
        .aggregate([
          {$match: filter},
          {$sort: {'sector': 1}},
          {$group: {_id: {sector: '$sector'}, count: {$sum: 1}}}
        ])
        .exec();
  }

  async getDistricts(filter) {
    return this.locationModel
        .aggregate([
          {$match: filter},
          {$sort: {'district': 1}},
          {$group: {_id: {district: '$district'}, count: {$sum: 1}}}
        ])
        .exec();
  }

  async updateLocations(body: {query: object; update: object}) {
    return this.locationModel.updateMany(body.query, body.update).exec();
  }

  async deleteLocation(businessId: string, locationId: string) {
    return this.locationModel.deleteOne({businessId, locationId}).exec();
  }

  async deleteBatchLocations(batchId: string) {
    return this.locationModel.deleteMany({'audit.batchId': batchId}).exec();
  }
  
  async updateBusinessRef() {
    const businesses = await this.businessModel.find({}).select(['_id', 'businessId']).exec();
    
    for (let i = 0; i < businesses.length; i++) {
      const business = businesses[i];
      console.log('business', business.businessId, business._id);
      await this.locationModel.updateMany({businessId: business.businessId}, {business: business._id}).exec()
    }
  }
}
