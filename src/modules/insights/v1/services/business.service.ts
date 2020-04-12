import {Injectable, Logger} from '@nestjs/common';
import {InjectModel} from '@nestjs/mongoose';
import {Model} from 'mongoose';

import {BusinessModel} from '../models/business.model';

@Injectable()
export class BusinessService {
  constructor(
      @InjectModel('Business') private readonly businessModel:
          Model<BusinessModel>, private readonly logger: Logger) {}

  async createBusiness(data: BusinessModel): Promise<BusinessModel> {
    this.logger.setContext(BusinessService.name);

    const business = await this.businessModel(data);
    return business.save();
  }

  async findBusiness(body) {
    return this.businessModel.findOne(body).exec();
  }

  async updateBusiness(body: {query: object; update: object}) {
    return this.businessModel.updateOne(body.query, body.update).exec();
  }
}
