import { IsString, IsEnum, IsOptional, IsNumber, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export enum UpdateStatusDto {
  DISPATCHING = 'DISPATCHING',
  DRIVER_ASSIGNED = 'DRIVER_ASSIGNED',
  EN_ROUTE = 'EN_ROUTE',
  ARRIVED = 'ARRIVED',
  IN_SERVICE = 'IN_SERVICE',
  DONE = 'DONE',
  CANCELLED = 'CANCELLED',
}

export class UpdateOccurrenceDto {
  @ApiProperty({ required: false, enum: UpdateStatusDto })
  @IsOptional()
  @IsEnum(UpdateStatusDto)
  status?: UpdateStatusDto;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsUUID()
  driverId?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsUUID()
  vehicleId?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  cancelReason?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  totalKm?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  clientRating?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  clientFeedback?: string;
}
