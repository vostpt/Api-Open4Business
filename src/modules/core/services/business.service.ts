import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { v1 as uuidv1 } from 'uuid';
import { BusinessModel } from '../models/business.model';

@Injectable()
export class BusinessService {
  constructor(
      @InjectModel('Business') private readonly businessModel:
          Model<BusinessModel>, private readonly logger: Logger) {}

  async createBusiness(data: BusinessModel): Promise<BusinessModel> {
    this.logger.setContext(BusinessService.name);

    const business = await this.businessModel(data);
    business.businessId = uuidv1();
    
    return business.save();
  }

  find(filter) {
    return this.businessModel.findOne(filter).exec();
  }

  findAll(filter) {
    return this.businessModel.find(filter).exec();
  }

  async updateBusiness(body: {query: object; update: object}) {
    return this.businessModel.updateOne(body.query, body.update).exec();
  }

  async deleteBusiness(businessId: string) {
    return this.businessModel.deleteOne({businessId}).exec();
  }
}
