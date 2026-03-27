import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
  Req,
  Res,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { CreateAuthDto } from './dto/create-auth.dto';
import { AuthGuard } from './auth.guard';
import type { Response, Request } from 'express';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  // 🔹 CSRF token endpoint
  @Get('csrf-token')
  getCsrfToken(@Req() req: Request) {
    const csrfToken = (req as any).csrfToken();
    return { csrfToken };
  }

  // 🔹 Register endpoint, XSS sanitization bilan
  @Post('register')
  register(@Body() createAuthDto: CreateAuthDto) {
    return this.authService.create(createAuthDto);
  }

  // 🔹 Login endpoint, XSS sanitization bilan
  @Post('login')
  login(
    @Body() loginDto: { username: string; password: string },
    @Res() res: Response,
  ) {
    return this.authService.login(loginDto, res);
  }

  @Post('refresh')
  refresh(@Req() req: Request, @Res() res: Response) {
    const refreshToken = req.cookies?.refresh_token as string | undefined;
    return this.authService.refreshSession(refreshToken, res);
  }

  // 🔹 Logout endpoint, faqat auth guard bilan
  @Post('logout')
  @UseGuards(AuthGuard)
  logout(@Req() req: Request, @Res() res: Response) {
    const userId = (req as any).user?.id as string | undefined;
    const result = this.authService.logout(userId, res);
    return res.status(200).json(result);
  }

  @Get('me')
  @UseGuards(AuthGuard)
  me(@Req() req: Request) {
    return this.authService.getAllMyData((req as any).user);
  }
}
