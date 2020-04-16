import { Module } from '@nestjs/common';
import { CsvModule } from 'nest-csv-parser';
import { BusinessesV1Module } from './v1/businesses-v1.module';

@Module({imports: [CsvModule, BusinessesV1Module], exports: [BusinessesV1Module]})
export class BusinessesModule {
}
