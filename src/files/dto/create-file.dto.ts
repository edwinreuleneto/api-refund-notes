import { ApiProperty } from '@nestjs/swagger';

export class CreateFileDto {
  @ApiProperty()
  name: string;

  @ApiProperty()
  extension: string;

  @ApiProperty()
  baseUrl: string;

  @ApiProperty()
  folder: string;

  @ApiProperty()
  file: string;

  @ApiProperty()
  url: string;

  @ApiProperty()
  size: number;
}
