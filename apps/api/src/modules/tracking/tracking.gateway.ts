import {
  WebSocketGateway, WebSocketServer,
  SubscribeMessage, ConnectedSocket, MessageBody,
  OnGatewayConnection, OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';
import { TrackingService, GpsUpdate } from './tracking.service';
import { OccurrencesGateway } from '../occurrences/occurrences.gateway';

@WebSocketGateway({
  cors: { origin: process.env.CORS_ORIGINS?.split(',') || '*', credentials: true },
  namespace: '/tracking',
})
export class TrackingGateway implements OnGatewayConnection, OnGatewayDisconnect {
  private readonly logger = new Logger(TrackingGateway.name);

  @WebSocketServer()
  server: Server;

  constructor(
    private trackingService: TrackingService,
    private occurrencesGateway: OccurrencesGateway,
  ) {}

  handleConnection(client: Socket) {
    const { driverId, tenantId } = client.handshake.auth;
    if (driverId) {
      client.join(`driver:${driverId}`);
      client.join(`tenant:${tenantId}`);
    }
    this.logger.debug(`Tracking client conectado: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.debug(`Tracking client desconectado: ${client.id}`);
  }

  // ── Driver envia posição GPS ──────────────────────────────────────────
  @SubscribeMessage('gps:update')
  async handleGpsUpdate(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: {
      vehicleId: string;
      tenantId: string;
      occurrenceId?: string;
      routeId?: string;
      lat: number;
      lng: number;
      speed?: number;
      heading?: number;
      accuracy?: number;
    },
  ) {
    const { driverId } = client.handshake.auth;

    const update: GpsUpdate = {
      vehicleId: data.vehicleId,
      driverId,
      routeId: data.routeId,
      lat: data.lat,
      lng: data.lng,
      speed: data.speed,
      heading: data.heading,
      accuracy: data.accuracy,
      recordedAt: new Date(),
    };

    await this.trackingService.processGpsUpdate(update);

    // Broadcast para todos no tenant (dashboard/torre de controle)
    this.occurrencesGateway.emitToTenant(data.tenantId, 'gps:update', {
      vehicleId: data.vehicleId,
      lat: data.lat,
      lng: data.lng,
      speed: data.speed,
      heading: data.heading,
      timestamp: update.recordedAt,
    });

    // Broadcast para sala da ocorrência (cliente acompanha)
    if (data.occurrenceId) {
      this.occurrencesGateway.emitToRoom(
        `occurrence:${data.occurrenceId}`,
        'driver:location',
        { lat: data.lat, lng: data.lng, timestamp: update.recordedAt },
      );
    }

    return { ack: true };
  }

  // ── Motorista aceita/recusa chamado ───────────────────────────────────
  @SubscribeMessage('call:response')
  async handleCallResponse(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: {
      occurrenceId: string;
      tenantId: string;
      accepted: boolean;
      reason?: string;
    },
  ) {
    const { driverId } = client.handshake.auth;

    if (data.accepted) {
      this.occurrencesGateway.emitToTenant(data.tenantId, 'driver:call_accepted', {
        occurrenceId: data.occurrenceId,
        driverId,
        acceptedAt: new Date(),
      });
    } else {
      this.occurrencesGateway.emitToTenant(data.tenantId, 'driver:call_refused', {
        occurrenceId: data.occurrenceId,
        driverId,
        reason: data.reason,
      });
    }

    return { ack: true };
  }
}
