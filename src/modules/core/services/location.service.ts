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

  async updateLocation(body: {query: object; update: object}) {
    return this.locationModel.updateOne(body.query, body.update).exec();
  }

  async getLocations(filter) {
    return this.locationModel.find(filter).exec();
  }

  async updateLocations(body: {query: object; update: object}) {
    return this.locationModel.updateMany(body.query, body.update).exec();
  }
}
