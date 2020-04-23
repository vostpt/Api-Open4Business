export class BatchModel {
  batchId: string;
  businessId: string;
  personName: string;
  personEmail: string;
  personPhone: string;
  status: string;
  createdAt: number;
  updatedAt: number;
  stats: {total: number, sucess: number, ignored: number};

  constructor() {
    this.stats = {total: 0, sucess: 0, ignored: 0};
  }
}