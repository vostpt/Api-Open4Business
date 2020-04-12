export class ResponseModel {
  resultCode: number;
  resultMessage: string;
  resultTimestamp: number;
  data: any;
  service: string;
  traceId: string;
}