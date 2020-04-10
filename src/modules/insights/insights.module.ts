import { Module } from '@nestjs/common';
import { CsvModule } from 'nest-csv-parser'
import { InsightsV1Module } from './v1/insights-v1.module';

@Module({
  imports: [
    CsvModule,
    InsightsV1Module
  ],
  exports: [
    InsightsV1Module
  ]
})
export class InsightsModule { }
