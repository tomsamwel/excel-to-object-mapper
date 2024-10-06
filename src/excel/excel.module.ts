import { Module } from '@nestjs/common';
import { ExcelController } from './excel.controller';
import { ExcelReaderService, MappingService } from './excel.service';

@Module({
  controllers: [ExcelController],
  providers: [ExcelReaderService, MappingService],
})
export class ExcelModule {}
