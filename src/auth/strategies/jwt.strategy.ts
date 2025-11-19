import { Injectable, UnauthorizedException, Logger } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { InjectRepository } from "@nestjs/typeorm";
import { ConfigService } from "@nestjs/config";
import { Repository } from "typeorm";

import { ExtractJwt, Strategy } from "passport-jwt";
import { JwtPayload } from "../interfaces";
import { User } from "../entities/user.entity";

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
    private readonly logger = new Logger(JwtStrategy.name);

    constructor(
        @InjectRepository(User)
        private readonly userRepository: Repository<User>,

        configService: ConfigService,
    ) {
        const secret = configService.get<string>('JWT_SECRET');
        if (!secret) {
            throw new Error('JWT_SECRET no está configurado en las variables de entorno');
        }

        super({
            secretOrKey: secret,
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            ignoreExpiration: false,
        });
        
        this.logger.log('JWT Strategy inicializada correctamente');
    }

    async validate(payload: JwtPayload): Promise<User> {
        this.logger.debug(`[VALIDATE] Validando token JWT - Payload: ${JSON.stringify(payload)}`);
        
        const { id } = payload;

        if (!id) {
            this.logger.warn(`[VALIDATE] Token inválido - ID no encontrado en payload`);
            throw new UnauthorizedException('Token no válido - ID no encontrado en payload');
        }

        this.logger.debug(`[VALIDATE] Buscando usuario con ID: ${id}`);
        const user = await this.userRepository.findOneBy({id});

        if ( !user ) {
            this.logger.warn(`[VALIDATE] Usuario no encontrado - ID: ${id}`);
            throw new UnauthorizedException('Token no válido - Usuario no encontrado');
        }

        if ( !user.isActive ) {
            this.logger.warn(`[VALIDATE] Usuario inactivo - ID: ${id}, Email: ${user.email}`);
            throw new UnauthorizedException('Usuario no activo');
        }

        this.logger.log(`[VALIDATE] Usuario validado exitosamente - ID: ${id}, Email: ${user.email}`);
        return user;
    }
}