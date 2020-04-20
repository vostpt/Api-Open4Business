import {Injectable, Logger} from '@nestjs/common';
import {InjectModel} from '@nestjs/mongoose';
import {Model} from 'mongoose';

import {LocationModel} from '../models/location.model';

@Injectable()
export class LocationService {
  constructor(
      @InjectModel('Location') private readonly locationModel:
          Model<LocationModel>, private readonly logger: Logger) {}

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
        await this.locationModel.findOne({locationId: location.locationId, businessId})
            .exec();

    if (!_location) {
      throw {message: 'Location not found'};
    }

    // Update fields
    _location.isOpen = location.isOpen;
    _location.company = location.company;
    _location.store = location.store;
    _location.address = location.address;
    _location.parish = location.fregesia;
    _location.council = location.concelho;
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

    return _location.save();
  }

  async countLocations(filter) {
    return this.locationModel.countDocuments(filter).exec();
  }

  async getLocationsWithPagination(filter, limit: number, offset: number) {
    return this.locationModel.find(filter).sort('store').limit(limit).skip(offset).exec();
  }

  async getLocations(filter) {
    return this.locationModel.find(filter).exec();
  }

  async updateLocations(body: {query: object; update: object}) {
    return this.locationModel.updateMany(body.query, body.update).exec();
  }

  async deleteLocation(businessId: string, locationId: string) {
    return this.locationModel.deleteOne({businessId, locationId}).exec();
  }
}
