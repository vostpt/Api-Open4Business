import {Injectable, Logger} from '@nestjs/common';
import * as fs from 'fs';
import {CsvParser} from 'nest-csv-parser';
import {LocationModel} from '../models/location.model';


@Injectable()
export class ParseService {
  constructor(
      private readonly csvParser: CsvParser, private readonly logger: Logger) {}

  async parseLocations(filename: string, headers: string[]) {
    // Create stream from file (or get it from S3)

    const stream = fs.createReadStream(filename);  // __dirname + '/some.csv'
    const data = await this.csvParser.parse(stream, LocationModel, null, null, {
      separator: ',', 
      mapHeaders: ({ header, index }) => {
        return headers[index];
      },

    });

    return data;
  }
}
