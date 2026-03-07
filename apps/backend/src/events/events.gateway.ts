import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayInit,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Logger, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { Server, Socket } from 'socket.io';

@Injectable()
@WebSocketGateway({
  cors: {
    origin: '*',
  },
  namespace: '/',
})
export class EventsGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(EventsGateway.name);

  constructor(
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  afterInit() {
    this.logger.log('WebSocket Gateway initialized');
  }

  async handleConnection(client: Socket) {
    try {
      const token =
        client.handshake.auth?.token ||
        client.handshake.headers?.authorization?.replace('Bearer ', '');

      if (!token) {
        this.logger.warn(`Client ${client.id} disconnected: no token`);
        client.disconnect();
        return;
      }

      const payload = this.jwtService.verify(token, {
        secret: this.configService.get('JWT_SECRET'),
      });

      const orgId = payload.organizationId;
      const userId = payload.sub;

      // Store user info on socket
      client.data = { userId, organizationId: orgId, email: payload.email };

      // Join organization room
      client.join(`org:${orgId}`);

      this.logger.log(
        `Client ${client.id} connected (user: ${userId}, org: ${orgId})`,
      );
    } catch (error) {
      this.logger.warn(
        `Client ${client.id} disconnected: invalid token - ${error.message}`,
      );
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client ${client.id} disconnected`);
  }

  // --- Public methods for other services to emit events ---

  emitToOrganization(orgId: string, event: string, data: any) {
    this.server.to(`org:${orgId}`).emit(event, data);
  }

  emitToConversation(conversationId: string, event: string, data: any) {
    this.server.to(`conv:${conversationId}`).emit(event, data);
  }

  emitToUser(userId: string, event: string, data: any) {
    this.server.to(`user:${userId}`).emit(event, data);
  }

  // Allow clients to join/leave conversation rooms
  joinConversation(client: Socket, conversationId: string) {
    client.join(`conv:${conversationId}`);
  }

  leaveConversation(client: Socket, conversationId: string) {
    client.leave(`conv:${conversationId}`);
  }
}
