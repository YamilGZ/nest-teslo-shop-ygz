import { Injectable, Logger, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Socket } from 'socket.io';
import { User } from 'src/auth/entities/user.entity';
import { Repository } from 'typeorm';

interface ConnectedClients {
    [id: string]: {
        Socket: Socket,
        user: User,
    }
}

interface ConnectedClientInfo {
    socketId: string;
    userId: string;
    fullName: string;
    email: string;
}

@Injectable()
export class MessagesWsService {

    private readonly logger = new Logger(MessagesWsService.name);
    private connectedClients: ConnectedClients = {}

    constructor(
        @InjectRepository(User)
        private readonly userRepository: Repository<User>,
    ) {}

    async registerClient(client: Socket, userId: string) {
        this.logger.debug(`[REGISTER] Intentando registrar cliente - Socket ID: ${client.id}, User ID: ${userId}`);

        const user = await this.userRepository.findOneBy({id: userId});

        if (!user) {
            this.logger.warn(`[REGISTER] Usuario no encontrado - User ID: ${userId}`);
            throw new UnauthorizedException('Usuario no encontrado');
        }

        if (!user.isActive) {
            this.logger.warn(`[REGISTER] Usuario inactivo intentando conectar - User ID: ${userId}, Email: ${user.email}`);
            throw new UnauthorizedException('Usuario no activo');
        }

        // Verificar si el usuario ya está conectado desde otro socket
        const existingClient = Object.values(this.connectedClients).find(
            clientData => clientData.user.id === userId
        );

        if (existingClient) {
            this.logger.warn(`[REGISTER] Usuario ya conectado, desconectando socket anterior - User ID: ${userId}, Socket anterior: ${existingClient.Socket.id}`);
            existingClient.Socket.disconnect();
        }

        this.connectedClients[client.id] = {
            Socket: client,
            user: user as User,
        };

        this.logger.log(`[REGISTER] Cliente registrado exitosamente - Socket ID: ${client.id}, User ID: ${userId}, Email: ${user.email}`);
    }

    removeClient(clientId: string) {
        const client = this.connectedClients[clientId];
        
        if (!client) {
            this.logger.warn(`[REMOVE] Intento de remover cliente inexistente - Socket ID: ${clientId}`);
            return;
        }

        const userId = client.user.id;
        const userEmail = client.user.email;
        
        delete this.connectedClients[clientId];
        
        this.logger.log(`[REMOVE] Cliente removido - Socket ID: ${clientId}, User ID: ${userId}, Email: ${userEmail}`);
    }

    getConnectedClients(): string[] {
        return Object.keys(this.connectedClients);
    }

    getConnectedClientsInfo(): ConnectedClientInfo[] {
        return Object.entries(this.connectedClients).map(([socketId, clientData]) => ({
            socketId,
            userId: clientData.user.id,
            fullName: clientData.user.fullName,
            email: clientData.user.email,
        }));
    }

    getUserFullName(clientId: string): string {
        const client = this.connectedClients[clientId];
        
        if (!client) {
            this.logger.warn(`[GET-USER] Cliente no encontrado - Socket ID: ${clientId}`);
            throw new BadRequestException('Cliente no encontrado');
        }

        return client.user.fullName;
    }

    getUserBySocketId(clientId: string): User | null {
        const client = this.connectedClients[clientId];
        return client ? client.user : null;
    }

    getTotalClients(): number {
        return Object.keys(this.connectedClients).length;
    }
}
