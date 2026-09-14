import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../infrastructure/database/prisma.service';
import { RedisService } from '../../infrastructure/redis/redis.service';

export interface GpsUpdate {
  vehicleId: string;
  driverId: string;
  routeId?: string;
  lat: number;
  lng: number;
  speed?: number;
  heading?: number;
  accuracy?: number;
  recordedAt: Date;
}

@Injectable()
export class TrackingService {
  private readonly logger = new Logger(TrackingService.name);
  private readonly GPS_BATCH_SIZE = 50;
  private readonly GPS_FLUSH_INTERVAL_MS = 5000;
  private gpsBatch: GpsUpdate[] = [];

  constructor(
    private prisma: PrismaService,
    private redis: RedisService,
  ) {
    // Flush batch periodicamente
    setInterval(() => this.flushGpsBatch(), this.GPS_FLUSH_INTERVAL_MS);
  }

  // ── Processar update de GPS ───────────────────────────────────────────
  async processGpsUpdate(update: GpsUpdate): Promise<void> {
    // Atualiza posição atual do veículo no Redis (imediato, para o mapa)
    await this.redis.setJson(
      `vehicle:location:${update.vehicleId}`,
      { lat: update.lat, lng: update.lng, speed: update.speed, heading: update.heading, ts: update.recordedAt },
      60, // TTL 60s — se veículo parar de enviar, some do mapa
    );

    // Atualiza posição no banco de forma assíncrona (batch)
    this.gpsBatch.push(update);
    if (this.gpsBatch.length >= this.GPS_BATCH_SIZE) {
      await this.flushGpsBatch();
    }
  }

  // ── Batch insert GPS points ───────────────────────────────────────────
  private async flushGpsBatch(): Promise<void> {
    if (this.gpsBatch.length === 0) return;

    const batch = [...this.gpsBatch];
    this.gpsBatch = [];

    try {
      // Atualiza posição atual dos veículos
      const vehicleUpdates = batch.reduce<Record<string, GpsUpdate>>((acc, g) => {
        if (!acc[g.vehicleId] || g.recordedAt > acc[g.vehicleId].recordedAt) {
          acc[g.vehicleId] = g;
        }
        return acc;
      }, {});

      await Promise.all([
        // Batch update veículos
        ...Object.values(vehicleUpdates).map((g) =>
          this.prisma.vehicle.update({
            where: { id: g.vehicleId },
            data: { currentLat: g.lat, currentLng: g.lng, lastGpsUpdate: g.recordedAt },
          }),
        ),
        // Batch insert GPS points nas rotas
        this.prisma.gpsPoint.createMany({
          data: batch
            .filter((g) => g.routeId)
            .map((g) => ({
              routeId: g.routeId!,
              lat: g.lat,
              lng: g.lng,
              speed: g.speed,
              heading: g.heading,
              accuracy: g.accuracy,
              recordedAt: g.recordedAt,
            })),
          skipDuplicates: true,
        }),
      ]);
    } catch (err) {
      this.logger.error('Erro ao flush GPS batch:', err);
      this.gpsBatch = [...batch, ...this.gpsBatch]; // re-enfileira
    }
  }

  // ── Obter posição atual de todos os veículos do tenant ────────────────
  async getActiveVehiclesLocations(tenantId: string) {
    const vehicles = await this.prisma.vehicle.findMany({
      where: {
        tenantId,
        status: { not: 'OFFLINE' },
        isActive: true,
        lastGpsUpdate: { gte: new Date(Date.now() - 5 * 60 * 1000) }, // últimos 5min
      },
      select: {
        id: true, plate: true, model: true, type: true, status: true,
        currentLat: true, currentLng: true, lastGpsUpdate: true,
        driver: {
          select: {
            id: true,
            user: { select: { name: true } },
          },
        },
      },
    });
    return vehicles;
  }
}
