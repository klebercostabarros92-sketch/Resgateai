import {
  Injectable, NotFoundException, ForbiddenException,
  BadRequestException, Logger,
} from '@nestjs/common';
import { PrismaService } from '../../infrastructure/database/prisma.service';
import { RabbitmqService } from '../../infrastructure/rabbitmq/rabbitmq.service';
import { CreateOccurrenceDto } from './dto/create-occurrence.dto';
import { UpdateOccurrenceDto } from './dto/update-occurrence.dto';
import { QueryOccurrenceDto } from './dto/query-occurrence.dto';
import { OccurrencesGateway } from './occurrences.gateway';

@Injectable()
export class OccurrencesService {
  private readonly logger = new Logger(OccurrencesService.name);
  private readonly QUEUE_OCCURRENCES = 'occurrences';
  private readonly QUEUE_NOTIFICATIONS = 'notifications';

  constructor(
    private prisma: PrismaService,
    private rabbitmq: RabbitmqService,
    private gateway: OccurrencesGateway,
  ) {}

  // ── Gerar protocolo ────────────────────────────────────────────────────
  private async generateProtocol(tenantId: string): Promise<string> {
    const year = new Date().getFullYear();
    const count = await this.prisma.occurrence.count({
      where: { tenantId, createdAt: { gte: new Date(`${year}-01-01`) } },
    });
    return `OS-${year}-${String(count + 1).padStart(6, '0')}`;
  }

  // ── Create ────────────────────────────────────────────────────────────
  async create(tenantId: string, createdById: string, dto: CreateOccurrenceDto) {
    const client = await this.prisma.client.findFirst({
      where: { id: dto.clientId, tenantId },
    });
    if (!client) throw new NotFoundException('Cliente não encontrado');

    const protocol = await this.generateProtocol(tenantId);

    const occurrence = await this.prisma.occurrence.create({
      data: {
        tenantId,
        protocol,
        createdById,
        clientId: dto.clientId,
        originAddress: dto.originAddress,
        originLat: dto.originLat,
        originLng: dto.originLng,
        destinationAddress: dto.destinationAddress,
        clientVehiclePlate: dto.clientVehiclePlate,
        clientVehicleModel: dto.clientVehicleModel,
        clientVehicleType: dto.clientVehicleType as any,
        problemType: dto.problemType as any,
        problemDescription: dto.problemDescription,
        notes: dto.notes,
        status: 'OPEN',
        // Cria rota associada
        route: { create: {} },
      },
      include: {
        client: { select: { id: true, name: true, phone: true } },
        driver: { select: { id: true, user: { select: { name: true } } } },
        vehicle: { select: { id: true, plate: true, model: true } },
        route: true,
      },
    });

    this.logger.log(`Nova ocorrência criada: ${protocol} [${tenantId}]`);

    // Notificar operadores via WebSocket
    this.gateway.emitToTenant(tenantId, 'dispatch:new_occurrence', {
      occurrenceId: occurrence.id,
      protocol,
      address: dto.originAddress,
      clientName: client.name,
      vehicleType: dto.clientVehicleType,
      problemType: dto.problemType,
    });

    // Publicar na fila para processamento
    await this.rabbitmq.publish(this.QUEUE_OCCURRENCES, {
      event: 'occurrence.created',
      occurrenceId: occurrence.id,
      tenantId,
    });

    return occurrence;
  }

  // ── FindAll ───────────────────────────────────────────────────────────
  async findAll(tenantId: string, query: QueryOccurrenceDto) {
    const {
      status, driverId, clientId, protocol,
      page = 1, limit = 20, dateFrom, dateTo,
    } = query;

    const where: Record<string, unknown> = { tenantId };
    if (status) where.status = status;
    if (driverId) where.driverId = driverId;
    if (clientId) where.clientId = clientId;
    if (protocol) where.protocol = { contains: protocol, mode: 'insensitive' };
    if (dateFrom || dateTo) {
      where.createdAt = {};
      if (dateFrom) (where.createdAt as Record<string, unknown>).gte = new Date(dateFrom);
      if (dateTo) (where.createdAt as Record<string, unknown>).lte = new Date(dateTo);
    }

    const [data, total] = await Promise.all([
      this.prisma.occurrence.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          client: { select: { id: true, name: true, phone: true } },
          driver: { select: { id: true, user: { select: { name: true, phone: true } } } },
          vehicle: { select: { id: true, plate: true, model: true, type: true } },
        },
      }),
      this.prisma.occurrence.count({ where }),
    ]);

    return {
      data,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  // ── FindOne ───────────────────────────────────────────────────────────
  async findOne(tenantId: string, id: string) {
    const occurrence = await this.prisma.occurrence.findFirst({
      where: { id, tenantId },
      include: {
        client: true,
        driver: { include: { user: { select: { name: true, phone: true, avatarUrl: true } } } },
        vehicle: true,
        route: { include: { gpsPoints: { orderBy: { recordedAt: 'asc' }, take: 1000 } } },
        documents: true,
        invoice: true,
        statusHistory: { orderBy: { createdAt: 'asc' } },
      },
    });
    if (!occurrence) throw new NotFoundException('Ocorrência não encontrada');
    return occurrence;
  }

  // ── Update ────────────────────────────────────────────────────────────
  async update(tenantId: string, id: string, userId: string, dto: UpdateOccurrenceDto) {
    const occurrence = await this.prisma.occurrence.findFirst({ where: { id, tenantId } });
    if (!occurrence) throw new NotFoundException('Ocorrência não encontrada');

    const updates: Record<string, unknown> = {};
    if (dto.notes !== undefined) updates.notes = dto.notes;
    if (dto.totalKm !== undefined) updates.totalKm = dto.totalKm;
    if (dto.clientRating !== undefined) updates.clientRating = dto.clientRating;
    if (dto.clientFeedback !== undefined) updates.clientFeedback = dto.clientFeedback;
    if (dto.driverId !== undefined) updates.driverId = dto.driverId;
    if (dto.vehicleId !== undefined) updates.vehicleId = dto.vehicleId;

    if (dto.status) {
      updates.status = dto.status;
      await this.applyStatusTransition(occurrence, dto.status, dto, updates);
    }

    const updated = await this.prisma.occurrence.update({
      where: { id },
      data: updates,
      include: {
        client: { select: { id: true, name: true, phone: true } },
        driver: { select: { id: true, user: { select: { name: true } } } },
        vehicle: { select: { id: true, plate: true } },
      },
    });

    if (dto.status) {
      // Registra no histórico
      await this.prisma.occurrenceStatusHistory.create({
        data: {
          occurrenceId: id,
          fromStatus: occurrence.status,
          toStatus: dto.status as any,
          changedById: userId,
          reason: dto.cancelReason,
        },
      });

      // Emite WebSocket
      this.gateway.emitToTenant(tenantId, 'occurrence:status_changed', {
        occurrenceId: id,
        oldStatus: occurrence.status,
        newStatus: dto.status,
        protocol: occurrence.protocol,
      });
      this.gateway.emitToRoom(`occurrence:${id}`, 'status_changed', {
        status: dto.status,
        updatedAt: new Date(),
      });

      // Publica para processamento assíncrono
      await this.rabbitmq.publish(this.QUEUE_NOTIFICATIONS, {
        event: 'occurrence.status_changed',
        occurrenceId: id,
        tenantId,
        status: dto.status,
      });
    }

    return updated;
  }

  // ── Cancel ────────────────────────────────────────────────────────────
  async cancel(tenantId: string, id: string, userId: string, reason: string) {
    return this.update(tenantId, id, userId, {
      status: 'CANCELLED' as any,
      cancelReason: reason,
    });
  }

  // ── Dashboard KPIs ────────────────────────────────────────────────────
  async getDashboardKpis(tenantId: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);

    const [
      totalToday, activeNow, availableVehicles, busyVehicles,
      avgServiceTime, dailyRevenue, monthlyRevenue, slaStats,
    ] = await Promise.all([
      this.prisma.occurrence.count({ where: { tenantId, createdAt: { gte: today } } }),
      this.prisma.occurrence.count({
        where: {
          tenantId,
          status: { in: ['DISPATCHING', 'DRIVER_ASSIGNED', 'EN_ROUTE', 'ARRIVED', 'IN_SERVICE'] },
        },
      }),
      this.prisma.vehicle.count({ where: { tenantId, status: 'AVAILABLE', isActive: true } }),
      this.prisma.vehicle.count({
        where: { tenantId, status: { in: ['ON_WAY', 'IN_SERVICE'] } },
      }),
      this.prisma.occurrence.aggregate({
        where: { tenantId, status: 'DONE', completedAt: { not: null }, createdAt: { gte: monthStart } },
        _avg: { totalKm: true },
      }),
      this.prisma.invoice.aggregate({
        where: { tenantId, createdAt: { gte: today } },
        _sum: { total: true },
      }),
      this.prisma.invoice.aggregate({
        where: { tenantId, createdAt: { gte: monthStart } },
        _sum: { total: true },
      }),
      this.prisma.occurrence.aggregate({
        where: { tenantId, status: 'DONE', slaMet: { not: null }, createdAt: { gte: monthStart } },
        _count: { slaMet: true },
      }),
    ]);

    const slaMetCount = await this.prisma.occurrence.count({
      where: { tenantId, status: 'DONE', slaMet: true, createdAt: { gte: monthStart } },
    });

    const slaIndex = slaStats._count.slaMet > 0
      ? Math.round((slaMetCount / slaStats._count.slaMet) * 100)
      : 100;

    return {
      totalToday,
      activeNow,
      availableVehicles,
      busyVehicles,
      avgKmPerService: avgServiceTime._avg.totalKm ?? 0,
      dailyRevenue: dailyRevenue._sum.total ?? 0,
      monthlyRevenue: monthlyRevenue._sum.total ?? 0,
      slaIndex,
    };
  }

  // ── Status Transition ─────────────────────────────────────────────────
  private async applyStatusTransition(
    current: { status: string },
    newStatus: string,
    dto: UpdateOccurrenceDto,
    updates: Record<string, unknown>,
  ): Promise<void> {
    const now = new Date();
    switch (newStatus) {
      case 'DRIVER_ASSIGNED':
        if (dto.driverId) {
          // Atualiza status do veículo
          if (dto.vehicleId) {
            await this.prisma.vehicle.update({
              where: { id: dto.vehicleId as string },
              data: { status: 'ON_WAY' },
            });
          }
        }
        updates.dispatchedAt = now;
        break;
      case 'IN_SERVICE':
        updates.serviceStartedAt = now;
        break;
      case 'ARRIVED':
        updates.actualArrival = now;
        break;
      case 'DONE':
        updates.completedAt = now;
        if (dto.vehicleId) {
          await this.prisma.vehicle.update({
            where: { id: dto.vehicleId as string },
            data: { status: 'AVAILABLE' },
          });
        }
        break;
      case 'CANCELLED':
        updates.cancelledAt = now;
        updates.cancelReason = dto.cancelReason;
        if (dto.vehicleId) {
          await this.prisma.vehicle.update({
            where: { id: dto.vehicleId as string },
            data: { status: 'AVAILABLE' },
          });
        }
        break;
    }
  }
}
