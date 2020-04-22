import { Injectable, Logger } from '@nestjs/common';
import * as fs from 'fs';
import { CsvParser } from 'nest-csv-parser';
import { LocationModel } from '../../../core/models/location.model';

import * as detectCharacterEncoding from 'detect-character-encoding';

const Iconv  = require('iconv').Iconv;

@Injectable()
export class ParseService {
  constructor(
      private readonly csvParser: CsvParser, private readonly logger: Logger) {}

  async parseLocations(filename: string, headers: string[], separator: string) {
    // Create stream from file (or get it from S3)

    const fileBuffer = fs.readFileSync(filename);
    const charsetMatch = detectCharacterEncoding(fileBuffer);
    console.log('charsetMatch', charsetMatch);

    let encoding = 'UTF-8';
    if (charsetMatch){
      if (charsetMatch.encoding == "windows-1252") {
        console.log('Found windows-1252!');
        const iconv = new Iconv(charsetMatch.encoding, 'UTF-8');
        const buffer = iconv.convert(fileBuffer);
        fs.writeFileSync(filename, buffer);
  
        encoding = 'UTF-8';
      } else {
        encoding = charsetMatch.encoding;
      }
    }

    const stream = fs.createReadStream(filename, encoding);

    const data = await this.csvParser.parse(stream, LocationModel, null, null, {
      encoding: 'utf8',
      separator: separator,
      mapHeaders: ({header, index}) => {
        return headers[index];
      },
    });

    return data;
  }
}
