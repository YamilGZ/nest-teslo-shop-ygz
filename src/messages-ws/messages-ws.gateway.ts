import { 
  OnGatewayConnection, 
  OnGatewayDisconnect, 
  SubscribeMessage, 
  WebSocketGateway, 
  WebSocketServer,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Logger, UsePipes, ValidationPipe, BadRequestException, UseFilters } from '@nestjs/common';
import { MessagesWsService } from './messages-ws.service';
import { Server, Socket } from 'socket.io';
import { NewMessageDto } from './dtos/new-message.dto';
import { JwtService } from '@nestjs/jwt';
import { JwtPayload } from 'src/auth/interfaces';
import { WsExceptionFilter } from './ws-exception.filter';

@WebSocketGateway({ cors: true, namespace: '/' })
@UseFilters(WsExceptionFilter)
export class MessagesWsGateway implements OnGatewayConnection, OnGatewayDisconnect{

  @WebSocketServer() wss: Server;
  private readonly logger = new Logger(MessagesWsGateway.name);

  constructor(
    private readonly messagesWsService: MessagesWsService,
    private readonly jwtService: JwtService,
  ) {}

  async handleConnection(client: Socket) {
    this.logger.debug(`[CONNECTION] Nueva conexión intentada - Socket ID: ${client.id}`);
    
    const token = this.extractToken(client);
    
    if (!token) {
      this.logger.warn(`[CONNECTION] Conexión rechazada - No se proporcionó token - Socket ID: ${client.id}`);
      client.disconnect();
      return;
    }

    let payload: JwtPayload;

    try {
      payload = this.jwtService.verify(token);
      this.logger.debug(`[CONNECTION] Token verificado - Socket ID: ${client.id}, User ID: ${payload.id}`);
      
      await this.messagesWsService.registerClient(client, payload.id);
      
      this.logger.log(`[CONNECTION] Cliente conectado exitosamente - Socket ID: ${client.id}, User ID: ${payload.id}`);
      
      // Notificar a todos los clientes sobre la actualización
      this.wss.emit('clients-updated', this.messagesWsService.getConnectedClients());
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      this.logger.error(`[CONNECTION] Error al conectar cliente - Socket ID: ${client.id}, Error: ${errorMessage}`);
      client.disconnect();
      return;
    }
  }

  handleDisconnect(client: Socket) {
    this.logger.debug(`[DISCONNECT] Cliente desconectándose - Socket ID: ${client.id}`);
    
    try {
      this.messagesWsService.removeClient(client.id);

      // Notificar a todos los clientes sobre la actualización
      this.wss.emit('clients-updated', this.messagesWsService.getConnectedClients());
      
      this.logger.log(`[DISCONNECT] Cliente desconectado - Socket ID: ${client.id}, Clientes restantes: ${this.messagesWsService.getTotalClients()}`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      this.logger.error(`[DISCONNECT] Error al desconectar cliente - Socket ID: ${client.id}, Error: ${errorMessage}`);
    }
  }

  @SubscribeMessage('message-from-client')
  @UsePipes(new ValidationPipe({ 
    whitelist: true, 
    forbidNonWhitelisted: false, // Permitir campos adicionales (como 'id' del cliente)
    transform: true,
    transformOptions: {
      enableImplicitConversion: true,
    },
    skipMissingProperties: false,
    exceptionFactory: (errors) => {
      const logger = new Logger(MessagesWsGateway.name);
      const messages = errors.map(error => 
        Object.values(error.constraints || {}).join(', ')
      ).join('; ');
      logger.warn(`[VALIDATION] Error de validación - Mensajes: ${messages}`);
      return new BadRequestException(`Error de validación: ${messages}`);
    },
  }))
  handleMessageFromClient(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: NewMessageDto
  ) {
    // Validar que payload existe y tiene message
    if (!payload || !payload.message) {
      this.logger.warn(`[MESSAGE] Payload inválido - Socket ID: ${client.id}`);
      client.emit('error', {
        type: 'validation',
        message: 'El mensaje es requerido',
        timestamp: new Date().toISOString(),
      });
      return;
    }

    const messagePreview = payload.message.length > 50 
      ? `${payload.message.substring(0, 50)}...` 
      : payload.message;
    
    this.logger.debug(`[MESSAGE] Mensaje recibido - Socket ID: ${client.id}, Mensaje: ${messagePreview}`);
    
    // Validar que el mensaje no esté vacío después del trim
    const trimmedMessage = payload.message.trim();
    if (!trimmedMessage || trimmedMessage.length === 0) {
      this.logger.warn(`[MESSAGE] Mensaje vacío rechazado - Socket ID: ${client.id}`);
      client.emit('error', {
        type: 'validation',
        message: 'El mensaje no puede estar vacío',
        timestamp: new Date().toISOString(),
      });
      return;
    }

    try {
      const user = this.messagesWsService.getUserBySocketId(client.id);
      
      if (!user) {
        this.logger.warn(`[MESSAGE] Cliente no encontrado - Socket ID: ${client.id}`);
        client.emit('error', {
          type: 'client_not_found',
          message: 'Cliente no encontrado. Por favor, reconecta.',
          timestamp: new Date().toISOString(),
        });
        return;
      }

      const messagePayload = {
        fullName: user.fullName,
        message: trimmedMessage,
        socketId: client.id,
        userId: user.id,
        timestamp: new Date().toISOString(),
      };

      // Emitir a todos los clientes conectados
      this.wss.emit('message-from-server', messagePayload);
      
      this.logger.log(`[MESSAGE] Mensaje enviado exitosamente - Socket ID: ${client.id}, Usuario: ${user.fullName}, Longitud: ${trimmedMessage.length}`);
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      const errorStack = error instanceof Error ? error.stack : undefined;
      
      this.logger.error(`[MESSAGE] Error al procesar mensaje - Socket ID: ${client.id}, Error: ${errorMessage}`, errorStack);
      
      // Notificar al cliente sobre el error con más detalles
      client.emit('error', {
        type: 'server_error',
        message: 'Error al procesar el mensaje. Por favor, intenta nuevamente.',
        details: process.env.NODE_ENV === 'development' ? errorMessage : undefined,
        timestamp: new Date().toISOString(),
      });
    }
  }

  /**
   * Extrae el token JWT del header de autenticación
   * Soporta formatos: "token" o "Bearer token"
   */
  private extractToken(client: Socket): string | null {
    const authHeader = client.handshake.headers.authentication || 
                      client.handshake.headers.authorization ||
                      client.handshake.auth?.token;

    if (!authHeader) {
      return null;
    }

    // Si es string, puede venir como "Bearer token" o solo "token"
    if (typeof authHeader === 'string') {
      // Remover "Bearer " si está presente
      return authHeader.startsWith('Bearer ') 
        ? authHeader.substring(7) 
        : authHeader;
    }

    return null;
  }
}
