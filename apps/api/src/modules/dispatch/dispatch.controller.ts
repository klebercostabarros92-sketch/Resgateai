import { Controller, Post, Body, UseGuards, Param, ParseUUIDPipe } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { DispatchService } from './dispatch.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { TenantId } from '../../common/decorators/tenant.decorator';
import { CurrentUser, AuthUser } from '../../common/decorators/current-user.decorator';
import { IsUUID, IsNumber, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

class AssignDriverDto {
  @ApiProperty() @IsUUID() driverId: string;
  @ApiProperty() @IsUUID() vehicleId: string;
}

@ApiTags('dispatch')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('dispatch')
export class DispatchController {
  constructor(private service: DispatchService) {}

  @Post(':occurrenceId/suggest')
  @Roles('ADMIN', 'MANAGER', 'OPERATOR')
  @ApiOperation({ summary: 'Obter ranking de melhores guinchos para a ocorrência' })
  suggest(
    @TenantId() tenantId: string,
    @Param('occurrenceId', ParseUUIDPipe) occurrenceId: string,
  ) {
    return this.service.suggestDrivers(tenantId, occurrenceId);
  }

  @Post(':occurrenceId/assign')
  @Roles('ADMIN', 'MANAGER', 'OPERATOR')
  @ApiOperation({ summary: 'Atribuir motorista à ocorrência (despacho)' })
  assign(
    @TenantId() tenantId: string,
    @CurrentUser() user: AuthUser,
    @Param('occurrenceId', ParseUUIDPipe) occurrenceId: string,
    @Body() dto: AssignDriverDto,
  ) {
    return this.service.assign(tenantId, occurrenceId, user.id, dto.driverId, dto.vehicleId);
  }
}
