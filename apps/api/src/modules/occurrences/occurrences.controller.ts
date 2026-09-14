import {
  Controller, Get, Post, Put, Patch, Body, Param,
  Query, UseGuards, HttpCode, HttpStatus, ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiParam } from '@nestjs/swagger';
import { OccurrencesService } from './occurrences.service';
import { CreateOccurrenceDto } from './dto/create-occurrence.dto';
import { UpdateOccurrenceDto } from './dto/update-occurrence.dto';
import { QueryOccurrenceDto } from './dto/query-occurrence.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser, AuthUser } from '../../common/decorators/current-user.decorator';
import { TenantId } from '../../common/decorators/tenant.decorator';

@ApiTags('occurrences')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('occurrences')
export class OccurrencesController {
  constructor(private service: OccurrencesService) {}

  @Post()
  @Roles('ADMIN', 'MANAGER', 'OPERATOR')
  @ApiOperation({ summary: 'Criar nova ocorrência' })
  create(
    @TenantId() tenantId: string,
    @CurrentUser() user: AuthUser,
    @Body() dto: CreateOccurrenceDto,
  ) {
    return this.service.create(tenantId, user.id, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Listar ocorrências com filtros e paginação' })
  findAll(@TenantId() tenantId: string, @Query() query: QueryOccurrenceDto) {
    return this.service.findAll(tenantId, query);
  }

  @Get('dashboard/kpis')
  @Roles('ADMIN', 'MANAGER', 'OPERATOR', 'FINANCIAL')
  @ApiOperation({ summary: 'KPIs do dashboard executivo' })
  getDashboardKpis(@TenantId() tenantId: string) {
    return this.service.getDashboardKpis(tenantId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Detalhes de uma ocorrência' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  findOne(
    @TenantId() tenantId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.service.findOne(tenantId, id);
  }

  @Patch(':id')
  @Roles('ADMIN', 'MANAGER', 'OPERATOR')
  @ApiOperation({ summary: 'Atualizar status ou dados da ocorrência' })
  update(
    @TenantId() tenantId: string,
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateOccurrenceDto,
  ) {
    return this.service.update(tenantId, id, user.id, dto);
  }

  @Post(':id/cancel')
  @Roles('ADMIN', 'MANAGER', 'OPERATOR')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Cancelar ocorrência' })
  cancel(
    @TenantId() tenantId: string,
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: { reason: string },
  ) {
    return this.service.cancel(tenantId, id, user.id, body.reason);
  }
}
