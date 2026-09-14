import {
  IsString, IsEnum, IsOptional, IsNumber,
  IsUUID, IsNotEmpty, MinLength,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export enum ProblemTypeDto {
  FLAT_TIRE = 'FLAT_TIRE',
  DRY_FUEL = 'DRY_FUEL',
  ELECTRICAL = 'ELECTRICAL',
  BATTERY = 'BATTERY',
  LOCKOUT = 'LOCKOUT',
  TOWING_LIGHT = 'TOWING_LIGHT',
  TOWING_HEAVY = 'TOWING_HEAVY',
  SPECIAL = 'SPECIAL',
  OTHER = 'OTHER',
}

export enum ClientVehicleTypeDto {
  MOTO = 'MOTO',
  CARRO = 'CARRO',
  UTILITARIO = 'UTILITARIO',
  CAMINHAO = 'CAMINHAO',
}

export class CreateOccurrenceDto {
  @ApiProperty({ description: 'ID do cliente' })
  @IsUUID()
  clientId: string;

  @ApiProperty({ description: 'Endereço de origem (localização do cliente)' })
  @IsString()
  @IsNotEmpty()
  originAddress: string;

  @ApiProperty({ description: 'Latitude de origem' })
  @IsNumber()
  originLat: number;

  @ApiProperty({ description: 'Longitude de origem' })
  @IsNumber()
  originLng: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  destinationAddress?: string;

  @ApiProperty({ description: 'Placa do veículo do cliente' })
  @IsString()
  @IsNotEmpty()
  clientVehiclePlate: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  clientVehicleModel?: string;

  @ApiProperty({ enum: ClientVehicleTypeDto })
  @IsEnum(ClientVehicleTypeDto)
  clientVehicleType: ClientVehicleTypeDto;

  @ApiProperty({ enum: ProblemTypeDto })
  @IsEnum(ProblemTypeDto)
  problemType: ProblemTypeDto;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  problemDescription?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  notes?: string;
}
