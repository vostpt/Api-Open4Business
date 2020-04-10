import { ApiProperty } from '@nestjs/swagger';

export class SuccessResponseModel {
  @ApiProperty({ enum: [200] }) resultCode: number;
  @ApiProperty({ enum: ['unix timestamp'] }) resultTimestamp: number;
  @ApiProperty({ enum: ['Ok'] }) resultMessage: string;
}
