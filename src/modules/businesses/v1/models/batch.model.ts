export class BatchModel {
  batchId: string;
  businessId: string;
  personName: string;
  personEmail: string;
  personPhone: string;
  status: string;
  createdAt: number;
  updatedAt: number;
  stats: {total: number, added: number, updated: number, ignored: number};

  constructor() {
    this.stats = {total: 0, added: 0, updated: 0, ignored: 0};
  }
}