import { Module } from '@nestjs/common';
import { AuthController } from './controller/auth.controller';
import { AuthService } from './services/auth/auth.service';
import { TokenService } from './services/token/token.service';

@Module({
  controllers: [AuthController],
  providers: [TokenService, AuthService],
  exports: [TokenService],
})
export class AuthModule {}
