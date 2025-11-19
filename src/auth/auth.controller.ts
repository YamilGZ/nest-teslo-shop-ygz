import { Controller, Get, Post, Body, UseGuards, Req, SetMetadata } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

import { AuthService } from './auth.service';
import { CreateUserDto, LoginUserDto } from './dto';
import { GetUser, RawHeaders, Auth, RoleProtected } from './decorators';
import { User } from './entities/user.entity';
import { UserRoleGuard } from './guards/user-role.guard';
import { ValidRoles } from './interfaces';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  createUser(@Body() createUserDto : CreateUserDto) {
    return this.authService.create(createUserDto);
  }

  @Post('login')
  loginUser(@Body() loginUserDto : LoginUserDto) {
    return this.authService.login(loginUserDto);
  }

  @Get('check-status')
  @Auth()
  checkAuthStatus(
    @GetUser() user: User
  ) {
    return this.authService.checkAuthStatus( user );
  }

  @Get('private')
  @UseGuards(AuthGuard())
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
  privateRoute3(
    @GetUser() user: User,
  ) {
    return {
      message: 'Hola private3',
      user,
    };
  }

}
