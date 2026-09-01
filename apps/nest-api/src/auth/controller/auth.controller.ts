import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Logger,
  Param,
  Post,
  Req,
  Res,
} from '@nestjs/common';
import type { Response } from 'express';
import { TOKEN_COOKIE, TOKEN_COOKIE_OPTIONS } from '../../common/constants/api.constants';
import { Public } from '../../common/decorators/public.decorator';
import type { ClientIp, CustomRequest } from '../../common/models/custom-request.model';
import type { LoginDto } from '../dto/login.dto';
import { AuthService } from '../services/auth/auth.service';

@Controller()
export class AuthController {
  private readonly logger = new Logger(AuthController.name);

  constructor(private readonly authService: AuthService) {}

  @Public()
  @Get('secret/:id')
  getSecret(@Param('id') id: string): { message: string } {
    return this.authService.revealSecret(id);
  }

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  login(
    @Req() req: CustomRequest,
    @Res({ passthrough: true }) res: Response,
    @Body() body: LoginDto,
  ): { message: string } {
    const clientIp: ClientIp = req.headers['x-forwarded-for'] || req.ip;
    const token = this.authService.createToken(clientIp, body?.password);

    res.cookie(TOKEN_COOKIE, token, TOKEN_COOKIE_OPTIONS);

    this.logger.log(`[Login] Token created for IP: ${String(clientIp)}`);

    return { message: 'Toop' };
  }

  @Get('session')
  session(@Req() req: CustomRequest): { message: string } {
    const cookie: string | undefined = req.cookies?.[TOKEN_COOKIE];
    const currentIp: ClientIp = req.headers['x-forwarded-for'] || req.ip;

    return this.authService.validateSession(cookie, currentIp);
  }
}
