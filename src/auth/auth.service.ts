import { BadRequestException, Injectable, InternalServerErrorException, UnauthorizedException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { JwtService } from '@nestjs/jwt';
import { Repository } from 'typeorm';

import * as bcrypt from 'bcrypt';

import { User } from './entities/user.entity';
import { CreateUserDto,LoginUserDto } from './dto';
import { JwtPayload } from './interfaces';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,

    private readonly jwtService: JwtService,
  ) {}

  async create(createUserDto: CreateUserDto) {
    try {
      this.logger.debug(`[CREATE] Creando usuario - Email: ${createUserDto.email}`);

      const { password, ...userData } = createUserDto;

      const user = this.userRepository.create({
        ...userData,
        password: bcrypt.hashSync(password, 10),
      });

      await this.userRepository.save(user);
      this.logger.log(`[CREATE] Usuario guardado en BD - ID: ${user.id}, Email: ${user.email}`);
      
      // Elimina la propiedad 'password' del objeto retornado de manera segura para el tipo
      const { password: _, ...userWithoutPassword } = user;

      const token = this.getJwtToken({ id: user.id });
      this.logger.log(`[CREATE] Token JWT generado para usuario - ID: ${user.id}`);

      return {
        ...user,
        token,
      };

    } catch (error) {
      this.logger.error(`[CREATE] Error al crear usuario - Email: ${createUserDto.email}`, error.stack);
      this.handleDBErrors(error);
    }
  }

  async login(loginUserDto: LoginUserDto) {
    const { password, email } = loginUserDto;
    this.logger.debug(`[LOGIN] Buscando usuario - Email: ${email}`);

    const user = await this.userRepository.findOne({ 
      where: { email }, 
      select: { email: true, password: true, id: true } 
    });

    if ( !user ) {
      this.logger.warn(`[LOGIN] Usuario no encontrado - Email: ${email}`);
      throw new UnauthorizedException('Credenciales no válidas - Email');
    }

    this.logger.debug(`[LOGIN] Usuario encontrado - ID: ${user.id}, verificando contraseña`);
    
    if ( !bcrypt.compareSync(password, user.password) ) {
      this.logger.warn(`[LOGIN] Contraseña incorrecta - Email: ${email}`);
      throw new UnauthorizedException('Credenciales no válidas - Password');
    }
    
    const token = this.getJwtToken({ id: user.id });
    this.logger.log(`[LOGIN] Login exitoso - ID: ${user.id}, Email: ${email}`);

    return {
      ...user,
      token,
    };
  }

  async checkAuthStatus( user: User ){
    this.logger.debug(`[CHECK-STATUS] Verificando estado - User ID: ${user.id}, Email: ${user.email}, Active: ${user.isActive}, Roles: ${user.roles.join(', ')}`);

    const token = this.getJwtToken({ id: user.id });
    this.logger.log(`[CHECK-STATUS] Nuevo token generado - User ID: ${user.id}`);

    return {
      ...user,
      token
    };
  }

  private getJwtToken(payload: JwtPayload) {
    const token = this.jwtService.sign(payload);
    return token;
  }

  private handleDBErrors(error: any): never {
    if (error.code === '23505') {
      this.logger.error(`[DB-ERROR] Violación de constraint único - Code: ${error.code}, Detail: ${error.detail}`);
      throw new BadRequestException(error.detail);
    }

    this.logger.error(`[DB-ERROR] Error inesperado en BD`, error.stack);
    console.error('Error completo:', error);

    throw new InternalServerErrorException('Unexpected error, check server logs');
  }

}
