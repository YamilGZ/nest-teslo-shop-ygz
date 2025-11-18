import { Injectable, UnauthorizedException } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { InjectRepository } from "@nestjs/typeorm";
import { ConfigService } from "@nestjs/config";
import { Repository } from "typeorm";

import { ExtractJwt, Strategy } from "passport-jwt";
import { JwtPayload } from "../interfaces";
import { User } from "../entities/user.entity";

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {

    constructor(
        @InjectRepository(User)
        private readonly userRepository: Repository<User>,

        configService: ConfigService,
    ) {
        super({
            secretOrKey: configService.get<string>('JWT_SECRET') || '',
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
        });
    }

    async validate(payload: JwtPayload): Promise<User> {

        const { id } = payload;

        const user = await this.userRepository.findOneBy({id});

        if ( !user ) throw new UnauthorizedException('Token no válido');

        if ( !user.isActive ) throw new UnauthorizedException('Usuario no activo');

        return user;
    }
}