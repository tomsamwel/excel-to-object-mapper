import { IsString, IsOptional, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class MappingDTO {
  @ApiProperty({
    description: 'The column name in the Excel file',
    example: 'Name',
  })
  @IsString()
  @IsNotEmpty()
  columnName: string;

  @ApiProperty({
    description: 'The desired field name in the JSON object',
    example: 'fullName',
  })
  @IsString()
  @IsNotEmpty()
  fieldName: string;

  @ApiProperty({
    description: 'Optional data type, e.g., "string", "number"',
    example: 'string',
    required: false,
  })
  @IsString()
  @IsOptional()
  dataType?: string;
}
