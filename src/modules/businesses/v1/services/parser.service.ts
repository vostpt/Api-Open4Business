import { Injectable, Logger } from '@nestjs/common';
import * as fs from 'fs';
import { CsvParser } from 'nest-csv-parser';
import { LocationModel } from '../../../core/models/location.model';


// import * as detectCharacterEncoding from 'detect-character-encoding';
// const Iconv  = require('iconv').Iconv;

@Injectable()
export class ParseService {
  constructor(
      private readonly csvParser: CsvParser, private readonly logger: Logger) {}

  async parseLocations(filename: string, headers: string[], separator: string) {
    const encoding = 'UTF-8';

    const stream = fs.createReadStream(filename, encoding);

    const data = await this.csvParser.parse(stream, LocationModel, null, null, {
      encoding,
      separator,
      mapHeaders: ({header, index}) => {
        return headers[index];
      },
    });

    return data;
  }
}
