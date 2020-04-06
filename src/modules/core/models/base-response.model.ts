export class BaseResponseModel {

  resultCode: number;
  resultMessage: string;
  resultTimestamp: string;

  constructor(data: Partial<BaseResponseModel>) {
    this.resultCode = data.resultCode;
    this.resultMessage = data.resultMessage;
    this.resultTimestamp = new Date().toISOString();
  }

}