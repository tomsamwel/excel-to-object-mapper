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
import { plainToInstance } from 'class-transformer';
import {
  ApiConsumes,
  ApiBody,
  ApiOperation,
  ApiResponse,
  ApiTags,
  ApiExtraModels,
  getSchemaPath,
} from '@nestjs/swagger';

// Custom filter to check file type
const excelFileFilter = (
  req: any,
  file: Express.Multer.File,
  callback: (error: Error | null, acceptFile: boolean) => void,
) => {
  if (!file.originalname.match(/\.(xlsx|xls)$/)) {
    return callback(
      new BadRequestException('Only Excel files are allowed!'),
      false,
    );
  }
  callback(null, true);
};

@ApiTags('excel')
@Controller('excel')
export class ExcelController {
  constructor(
    private readonly excelReaderService: ExcelReaderService,
    private readonly mappingService: MappingService,
  ) {}

  @Post('upload')
  @UseInterceptors(
    FileInterceptor('file', {
      fileFilter: excelFileFilter,
    }),
  )
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
  @ApiExtraModels(MappingDTO)
  @ApiBody({
    description: 'Excel file upload with optional mappings',
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
        mappings: {
          type: 'array',
          items: {
            $ref: getSchemaPath(MappingDTO),
          },
          description: 'Mappings as an array of MappingDTO objects',
        },
      },
    },
  })
  @HttpCode(HttpStatus.OK)
  async excelToObject(
    @UploadedFile() file: Express.Multer.File,
    @Body('mappings') mappings: string,
  ): Promise<object> {
    this.validateFile(file);
    const mappingInstances = this.parseMappings(mappings);
    const excelData = this.excelReaderService.readExcel(file);

    return mappingInstances.length > 0
      ? this.mappingService.applyMappings(excelData, mappingInstances)
      : excelData;
  }

  private validateFile(file: Express.Multer.File): void {
    if (!file) {
      throw new BadRequestException('File is required!');
    }
  }

  private parseMappings(mappings: string): MappingDTO[] {
    if (!mappings) {
      return [];
    }
    try {
      const parsedMappings = JSON.parse(mappings);
      if (Array.isArray(parsedMappings)) {
        return plainToInstance(MappingDTO, parsedMappings);
      } else {
        throw new BadRequestException('Mappings should be an array of objects');
      }
    } catch {
      throw new BadRequestException('Invalid JSON format for mappings');
    }
  }
}
