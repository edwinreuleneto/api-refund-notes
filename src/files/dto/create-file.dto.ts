// Dependencies
import { ApiProperty } from '@nestjs/swagger';

export class CreateFileDto {
  @ApiProperty({
    type: 'string',
  })
  name!: string;

  @ApiProperty({
    type: 'string',
  })
  extension!: string;

  @ApiProperty({
    type: 'string',
  })
  baseUrl!: string;

  @ApiProperty({
    type: 'string',
  })
  folder!: string;

  @ApiProperty({
    type: 'string',
  })
  file!: string;

  @ApiProperty({
    type: 'string',
  })
  url!: string;

  @ApiProperty({
    type: 'number',
  })
  size!: number;
}
