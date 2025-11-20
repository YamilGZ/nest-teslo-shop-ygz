import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MessagesWsService } from './messages-ws.service';
import { MessagesWsGateway } from './messages-ws.gateway';
import { AuthModule } from 'src/auth/auth.module';
import { User } from 'src/auth/entities/user.entity';

@Module({
  providers: [MessagesWsGateway, MessagesWsService],
  imports: [
    AuthModule,
    TypeOrmModule.forFeature([User]),
  ],
})
export class MessagesWsModule {}
