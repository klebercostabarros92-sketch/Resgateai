import {
  WebSocketGateway, WebSocketServer,
  SubscribeMessage, ConnectedSocket,
  MessageBody, OnGatewayConnection, OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger, UseGuards } from '@nestjs/common';

@WebSocketGateway({
  cors: { origin: process.env.CORS_ORIGINS?.split(',') || '*', credentials: true },
  transports: ['websocket', 'polling'],
  namespace: '/',
})
export class OccurrencesGateway implements OnGatewayConnection, OnGatewayDisconnect {
  private readonly logger = new Logger(OccurrencesGateway.name);

  @WebSocketServer()
  server: Server;

  private connectedClients = new Map<string, { tenantId: string; role: string; userId: string }>();

  // ── Conexão ────────────────────────────────────────────────────────────
  handleConnection(client: Socket) {
    const { tenantId, userId, role } = client.handshake.auth;
    if (!tenantId) {
      client.disconnect();
      return;
    }
    this.connectedClients.set(client.id, { tenantId, userId, role });
    client.join(`tenant:${tenantId}`);
    this.logger.log(`Cliente conectado: ${client.id} [tenant:${tenantId}]`);
  }

  handleDisconnect(client: Socket) {
    this.connectedClients.delete(client.id);
    this.logger.log(`Cliente desconectado: ${client.id}`);
  }

  // ── Entrar na sala de uma ocorrência ───────────────────────────────────
  @SubscribeMessage('join:occurrence')
  handleJoinOccurrence(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { occurrenceId: string },
  ) {
    client.join(`occurrence:${data.occurrenceId}`);
    return { event: 'joined', room: `occurrence:${data.occurrenceId}` };
  }

  @SubscribeMessage('leave:occurrence')
  handleLeaveOccurrence(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { occurrenceId: string },
  ) {
    client.leave(`occurrence:${data.occurrenceId}`);
  }

  // ── Emitters ───────────────────────────────────────────────────────────
  emitToTenant(tenantId: string, event: string, data: unknown) {
    this.server.to(`tenant:${tenantId}`).emit(event, data);
  }

  emitToRoom(room: string, event: string, data: unknown) {
    this.server.to(room).emit(event, data);
  }

  emitToDriver(driverId: string, event: string, data: unknown) {
    this.server.to(`driver:${driverId}`).emit(event, data);
  }

  getConnectedCount(tenantId?: string): number {
    if (tenantId) {
      return [...this.connectedClients.values()].filter(
        (c) => c.tenantId === tenantId,
      ).length;
    }
    return this.connectedClients.size;
  }
}
