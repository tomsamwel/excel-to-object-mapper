import { Injectable } from '@nestjs/common';
import * as xlsx from 'xlsx';
import { MappingDTO } from './dto/mapping.dto';

@Injectable()
export class ExcelReaderService {
  readExcel(file: Express.Multer.File) {
    const workbook = xlsx.read(file.buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    return xlsx.utils.sheet_to_json(sheet);
  }
}

@Injectable()
export class MappingService {
  applyMappings(data: any[], mappings: MappingDTO[]): any[] {
    return data.map((row) => {
      const newRow = { ...row }; // Start with the original row data

      mappings.forEach((mapping) => {
        if (row.hasOwnProperty(mapping.columnName)) {
          newRow[mapping.fieldName] = this.castDataType(
            row[mapping.columnName],
            mapping.dataType,
          );
          if (mapping.fieldName !== mapping.columnName) {
            delete newRow[mapping.columnName]; // Remove original column if renamed
          }
        }
      });

      return newRow;
    });
  }

  private castDataType(value: any, dataType: string): any {
    switch (dataType?.toLowerCase()) {
      case 'number':
        return Number(value);
      case 'string':
        return String(value);
      case 'boolean':
        return value === 'true';
      default:
        return value;
    }
  }
}
