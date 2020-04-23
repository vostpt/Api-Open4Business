import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { v1 as uuidv1 } from 'uuid';
import { BatchModel } from '../models/batch.model';

@Injectable()
export class BatchService {
  constructor(
      @InjectModel('Batch') private readonly batchModel:
          Model<BatchModel>, private readonly logger: Logger) {}

  async createBatch(data: BatchModel): Promise<BatchModel> {
    this.logger.setContext(BatchService.name);

    const batch = await this.batchModel(data);
    batch.batchId = batch.batchId || uuidv1();
    
    return batch.save();
  }

  find(filter) {
    return this.batchModel.findOne(filter).exec();
  }

  findMany(filter) {
    return this.batchModel.find(filter).exec();
  }

  async updateBatch(body: {query: object; update: object}) {
    return this.batchModel.updateOne(body.query, body.update).exec();
  }

  async deleteBatch(businessId: string) {
    return this.batchModel.deleteOne({businessId}).exec();
  }
}
