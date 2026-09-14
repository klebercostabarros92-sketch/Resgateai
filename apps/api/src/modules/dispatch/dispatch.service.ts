import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { PrismaService } from '../../infrastructure/database/prisma.service';
import { RedisService } from '../../infrastructure/redis/redis.service';
import { OccurrencesService } from '../occurrences/occurrences.service';

export interface DispatchCandidate {
  rank: number;
  driverId: string;
  vehicleId: string;
  driverName: string;
  vehiclePlate: string;
  vehicleType: string;
  currentLat: number;
  currentLng: number;
  distanceMeters: number;
  distanceText: string;
  durationSeconds: number;
  durationText: string;
  driverRating: number;
  totalServices: number;
  score: number;
}

@Injectable()
export class DispatchService {
  private readonly logger = new Logger(DispatchService.name);
  private readonly CACHE_TTL = 120; // 2 minutos cache de distância

  constructor(
    private prisma: PrismaService,
    private redis: RedisService,
    private config: ConfigService,
    private http: HttpService,
    private occurrencesService: OccurrencesService,
  ) {}

  // ── Sugerir melhores guinchos ─────────────────────────────────────────
  async suggestDrivers(
    tenantId: string,
    occurrenceId: string,
    topN = 3,
  ): Promise<DispatchCandidate[]> {
    const occurrence = await this.prisma.occurrence.findFirst({
      where: { id: occurrenceId, tenantId },
    });
    if (!occurrence) throw new NotFoundException('Ocorrência não encontrada');
    if (!['OPEN', 'DISPATCHING'].includes(occurrence.status)) {
      throw new BadRequestException('Ocorrência não está disponível para despacho');
    }

    // Busca veículos disponíveis com motorista ativo
    const availableVehicles = await this.prisma.vehicle.findMany({
      where: {
        tenantId,
        status: 'AVAILABLE',
        isActive: true,
        currentLat: { not: null },
        currentLng: { not: null },
        driver: { isOnline: true },
      },
      include: {
        driver: {
          include: {
            user: { select: { name: true, phone: true } },
          },
        },
      },
    });

    if (availableVehicles.length === 0) {
      this.logger.warn(`Nenhum veículo disponível para tenant ${tenantId}`);
      return [];
    }

    // Calcula distâncias via Google Distance Matrix API
    const distances = await this.getDistances(
      availableVehicles,
      Number(occurrence.originLat),
      Number(occurrence.originLng),
    );

    // Monta candidatos com score
    const candidates: DispatchCandidate[] = availableVehicles
      .map((vehicle, idx) => {
        const dist = distances[idx];
        if (!dist) return null;

        const driver = vehicle.driver!;
        // Score: 70% proximidade + 20% avaliação + 10% experiência
        const proximityScore = Math.max(0, 100 - (dist.durationSeconds / 60)); // 1 min = 1 ponto a menos
        const ratingScore = (Number(driver.rating) / 5) * 20;
        const expScore = Math.min(10, driver.totalServices / 10);
        const score = proximityScore * 0.7 + ratingScore + expScore;

        return {
          rank: 0,
          driverId: driver.id,
          vehicleId: vehicle.id,
          driverName: driver.user.name,
          vehiclePlate: vehicle.plate,
          vehicleType: vehicle.type,
          currentLat: Number(vehicle.currentLat),
          currentLng: Number(vehicle.currentLng),
          distanceMeters: dist.distanceMeters,
          distanceText: dist.distanceText,
          durationSeconds: dist.durationSeconds,
          durationText: dist.durationText,
          driverRating: Number(driver.rating),
          totalServices: driver.totalServices,
          score,
        } as DispatchCandidate;
      })
      .filter(Boolean) as DispatchCandidate[];

    // Ordena por score e rankeia
    candidates.sort((a, b) => b.score - a.score);
    candidates.slice(0, topN).forEach((c, i) => (c.rank = i + 1));

    this.logger.log(
      `Despacho: ${candidates.length} candidatos para ocorrência ${occurrenceId}`,
    );
    return candidates.slice(0, topN);
  }

  // ── Despachar (atribuir motorista) ────────────────────────────────────
  async assign(
    tenantId: string,
    occurrenceId: string,
    userId: string,
    driverId: string,
    vehicleId: string,
  ) {
    const driver = await this.prisma.driver.findFirst({
      where: { id: driverId },
      include: { vehicle: true },
    });
    if (!driver) throw new NotFoundException('Motorista não encontrado');

    // Atualiza ocorrência para DRIVER_ASSIGNED
    const updated = await this.occurrencesService.update(
      tenantId, occurrenceId, userId,
      { status: 'DRIVER_ASSIGNED' as any, driverId, vehicleId },
    );

    this.logger.log(`Ocorrência ${occurrenceId} despachada para motorista ${driverId}`);
    return updated;
  }

  // ── Google Distance Matrix API ────────────────────────────────────────
  private async getDistances(
    vehicles: { id: string; currentLat: unknown; currentLng: unknown }[],
    destLat: number,
    destLng: number,
  ): Promise<{ distanceMeters: number; distanceText: string; durationSeconds: number; durationText: string }[]> {
    const apiKey = this.config.get('GOOGLE_MAPS_API_KEY');
    if (!apiKey) {
      this.logger.warn('GOOGLE_MAPS_API_KEY não configurada — usando distância euclidiana');
      return vehicles.map((v) => ({
        distanceMeters: this.haversineMeters(
          Number(v.currentLat), Number(v.currentLng), destLat, destLng,
        ),
        distanceText: '',
        durationSeconds: 0,
        durationText: '',
      }));
    }

    const cacheKey = `dispatch:${destLat},${destLng}:${vehicles.map((v) => v.id).join(',')}`;
    const cached = await this.redis.getJson<ReturnType<typeof this.getDistances> extends Promise<infer T> ? T : never>(cacheKey);
    if (cached) return cached;

    const origins = vehicles
      .map((v) => `${v.currentLat},${v.currentLng}`)
      .join('|');
    const destination = `${destLat},${destLng}`;

    const { data } = await firstValueFrom(
      this.http.get('https://maps.googleapis.com/maps/api/distancematrix/json', {
        params: {
          origins,
          destinations: destination,
          key: apiKey,
          departure_time: 'now',
          traffic_model: 'best_guess',
          units: 'metric',
        },
      }),
    );

    const results = data.rows.map((row: { elements: { distance: { value: number; text: string }; duration: { value: number; text: string }; status: string }[] }) => {
      const el = row.elements[0];
      if (el.status !== 'OK') {
        return { distanceMeters: 999999, distanceText: 'N/A', durationSeconds: 999999, durationText: 'N/A' };
      }
      return {
        distanceMeters: el.distance.value,
        distanceText: el.distance.text,
        durationSeconds: el.duration.value,
        durationText: el.duration.text,
      };
    });

    await this.redis.setJson(cacheKey, results, this.CACHE_TTL);
    return results;
  }

  // ── Haversine fallback ────────────────────────────────────────────────
  private haversineMeters(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 6371000;
    const toRad = (d: number) => (d * Math.PI) / 180;
    const dLat = toRad(lat2 - lat1);
    const dLng = toRad(lng2 - lng1);
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }
}
