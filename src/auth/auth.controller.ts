import { Controller, Get, Post, Body, UseGuards, Req, SetMetadata, Logger } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiBody } from '@nestjs/swagger';

import { AuthService } from './auth.service';
import { CreateUserDto, LoginUserDto } from './dto';
import { GetUser, RawHeaders, Auth, RoleProtected } from './decorators';
import { User } from './entities/user.entity';
import { UserRoleGuard } from './guards/user-role.guard';
import { ValidRoles } from './interfaces';

@ApiTags('Auth - Autenticación y Autorización')
@Controller('auth')
export class AuthController {
  private readonly logger = new Logger(AuthController.name);

  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @ApiOperation({ 
    summary: 'Registrar nuevo usuario',
    description: 'Crea un nuevo usuario en el sistema. Retorna el usuario creado con su token JWT.'
  })
  @ApiResponse({ 
    status: 201, 
    description: 'Usuario creado exitosamente',
    schema: {
      example: {
        id: 'cd533345-f1f3-48c9-a62e-7dc2da50c8f8',
        email: 'usuario@ejemplo.com',
        fullName: 'Juan Pérez',
        isActive: true,
        roles: ['user'],
        token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
      }
    }
  })
  @ApiResponse({ status: 400, description: 'Error de validación o email duplicado' })
  @ApiBody({ type: CreateUserDto })
  async createUser(@Body() createUserDto : CreateUserDto) {
    this.logger.log(`[REGISTER] Intento de registro - Email: ${createUserDto.email}`);
    try {
      const result = await this.authService.create(createUserDto);
      this.logger.log(`[REGISTER] Usuario registrado exitosamente - Email: ${createUserDto.email}`);
      return result;
    } catch (error) {
      this.logger.error(`[REGISTER] Error al registrar usuario - Email: ${createUserDto.email}`, error.stack);
      throw error;
    }
  }

  @Post('login')
  @ApiOperation({ 
    summary: 'Iniciar sesión',
    description: 'Autentica un usuario y retorna su información con un token JWT válido por 1 hora.'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Login exitoso',
    schema: {
      example: {
        id: 'cd533345-f1f3-48c9-a62e-7dc2da50c8f8',
        email: 'test1@google.com',
        token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
      }
    }
  })
  @ApiResponse({ status: 401, description: 'Credenciales inválidas' })
  @ApiBody({ type: LoginUserDto })
  async loginUser(@Body() loginUserDto : LoginUserDto) {
    this.logger.log(`[LOGIN] Intento de login - Email: ${loginUserDto.email}`);
    try {
      const result = await this.authService.login(loginUserDto);
      this.logger.log(`[LOGIN] Login exitoso - Email: ${loginUserDto.email}`);
      return result;
    } catch (error) {
      this.logger.warn(`[LOGIN] Login fallido - Email: ${loginUserDto.email} - ${error.message}`);
      throw error;
    }
  }

  @Get('check-status')
  @Auth()
  @ApiBearerAuth()
  @ApiOperation({ 
    summary: 'Verificar estado de autenticación',
    description: 'Verifica el token JWT y retorna la información del usuario autenticado con un nuevo token.'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Token válido',
    schema: {
      example: {
        id: 'cd533345-f1f3-48c9-a62e-7dc2da50c8f8',
        email: 'test1@google.com',
        fullName: 'Test One',
        isActive: true,
        roles: ['admin'],
        token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
      }
    }
  })
  @ApiResponse({ status: 401, description: 'Token inválido o usuario no activo' })
  checkAuthStatus(
    @GetUser() user: User
  ) {
    this.logger.log(`[CHECK-STATUS] Verificación de token - User ID: ${user.id}, Email: ${user.email}`);
    try {
      const result = this.authService.checkAuthStatus( user );
      this.logger.log(`[CHECK-STATUS] Token válido - User ID: ${user.id}`);
      return result;
    } catch (error) {
      this.logger.error(`[CHECK-STATUS] Error al verificar token - User ID: ${user.id}`, error.stack);
      throw error;
    }
  }

  @Get('private')
  @UseGuards(AuthGuard())
  @ApiBearerAuth()
  @ApiOperation({ 
    summary: 'Ruta privada de prueba',
    description: 'Ruta de ejemplo que requiere autenticación. Muestra información del usuario autenticado.'
  })
  @ApiResponse({ status: 200, description: 'Acceso permitido' })
  @ApiResponse({ status: 401, description: 'No autenticado' })
  testingPrivateRoute(
    //@Req() request: Express.Request,
    @GetUser() user: User,
    @GetUser('email') userEmail: string,
    @RawHeaders() rawHeaders: string[],
  ) {
    //console.log(request);
    //console.log(user);
    return {
      message: 'Hola mundo',
      user,
      userEmail,
      rawHeaders,
    };
  }

  //@SetMetadata('roles', ['admin', 'super-user'])

  @Get('private2')
  @RoleProtected( ValidRoles.superUser )
  @UseGuards(AuthGuard(), UserRoleGuard)
  @ApiBearerAuth()
  @ApiOperation({ 
    summary: 'Ruta privada con rol super-user',
    description: 'Ruta de ejemplo que requiere autenticación y rol de super-user.'
  })
  @ApiResponse({ status: 200, description: 'Acceso permitido' })
  @ApiResponse({ status: 401, description: 'No autenticado' })
  @ApiResponse({ status: 403, description: 'Rol insuficiente' })
  privateRoute2(
    @GetUser() user: User,
  ) {
    return {
      message: 'Hola private2',
      user,
    };
  }

  @Get('private3')
  @Auth(ValidRoles.superUser)
  @ApiBearerAuth()
  @ApiOperation({ 
    summary: 'Ruta privada con rol super-user (decorador Auth)',
    description: 'Ruta de ejemplo usando el decorador @Auth() que requiere rol de super-user.'
  })
  @ApiResponse({ status: 200, description: 'Acceso permitido' })
  @ApiResponse({ status: 401, description: 'No autenticado' })
  @ApiResponse({ status: 403, description: 'Rol insuficiente' })
  privateRoute3(
    @GetUser() user: User,
  ) {
    return {
      message: 'Hola private3',
      user,
    };
  }

}
