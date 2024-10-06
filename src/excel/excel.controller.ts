import {
  Body,
  Controller,
  Post,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ExcelReaderService, MappingService } from './excel.service';
import { FileInterceptor } from '@nestjs/platform-express';
import { MappingDTO } from './dto/mapping.dto';
import {
  ApiConsumes,
  ApiBody,
  ApiOperation,
  ApiResponse,
  ApiTags,
  ApiExtraModels,
} from '@nestjs/swagger';
import { plainToInstance } from 'class-transformer';

// Custom filter to check file type
const excelFileFilter = (
  _: any,
  file: Express.Multer.File,
  callback: (error: Error | null, acceptFile: boolean) => void,
) => {
  const isExcelFile = file.originalname.match(/\.(xlsx|xls)$/);
  callback(
    isExcelFile
      ? null
      : new BadRequestException('Only Excel files are allowed!'),
    Boolean(isExcelFile),
  );
};

@ApiTags('excel')
@ApiExtraModels(MappingDTO)
@Controller('excel')
export class ExcelController {
  constructor(
    private readonly excelReaderService: ExcelReaderService,
    private readonly mappingService: MappingService,
  ) {}

  @Post('upload')
  @UseInterceptors(FileInterceptor('file', { fileFilter: excelFileFilter }))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Upload an Excel file and map it to JSON' })
  @ApiResponse({
    status: 200,
    description: 'Excel file successfully processed.',
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid file type or bad request.',
  })
  @ApiBody({
    description: 'Excel file upload with optional mappings',
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'The Excel file to be uploaded (.xls or .xlsx)',
        },
        mappings: {
          type: 'string',
          example:
            '[{"columnName": "Name", "fieldName": "fullName", "dataType": "string"}]',
          description:
            'Mappings as a JSON string representing an array of MappingDTO objects.',
        },
      },
    },
  })
  @HttpCode(HttpStatus.OK)
  async excelToObject(
    @UploadedFile() file: Express.Multer.File,
    @Body('mappings') mappings?: string,
  ): Promise<object> {
    if (!file) {
      throw new BadRequestException('File is required!');
    }

    const mappingInstances = mappings ? this.parseMappings(mappings) : [];
    const excelData = this.excelReaderService.readExcel(file);
    return this.mappingService.applyMappings(excelData, mappingInstances);
  }

  private parseMappings(mappings: string): MappingDTO[] {
    try {
      const parsedMappings = JSON.parse(mappings);
      if (!Array.isArray(parsedMappings)) {
        throw new BadRequestException('Mappings should be an array of objects');
      }
      return plainToInstance(MappingDTO, parsedMappings);
    } catch {
      throw new BadRequestException('Invalid JSON format for mappings');
    }
  }
}
