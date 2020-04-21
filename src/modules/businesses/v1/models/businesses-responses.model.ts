import { SuccessResponseModel } from '../../../core/models/success-response.model';
import { ApiProperty } from '@nestjs/swagger';
import { LocationModel } from '../../../core/models/location.model';

class LocationsResponseDataModel {
  @ApiProperty({ isArray: true, type: LocationModel }) locations: LocationModel[];
}

export class LocationsResponseModel extends SuccessResponseModel {
  @ApiProperty({ type: LocationsResponseDataModel }) data: LocationsResponseDataModel;
}