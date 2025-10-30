// import {
//   Controller,
//   Get,
//   Post,
//   Body,
//   UseGuards,
//   Req,
//   SetMetadata,
//   Res,
//   UsePipes,
// } from '@nestjs/common';
// import { AuthService } from './auth.service';
// import { CreateAuthDto } from './dto/create-auth.dto';
// import { AuthGuard } from './auth.guard';
// import { RolesGuard } from './role.guard';
// import type { Response } from 'express';
// import { SanitizePipe } from 'src/common/pipes/sanitize.pipe';

// @Controller('auth')
// export class AuthController {
//   constructor(private readonly authService: AuthService) {}

//   @UsePipes(new SanitizePipe)
//   @Post('register')
//   create(@Body() createAuthDto: CreateAuthDto) {
//     return this.authService.create(createAuthDto);
//   }

//   @UsePipes(new SanitizePipe)
//   @Post('login')
//   async login(
//     @Body() loginDto: { username: string; password: string },
//     @Res() res: Response,
//   ) {
//     return await this.authService.login(loginDto, res);
//   }

//   @Post('logout')
//   @UseGuards(AuthGuard)
//   logout(@Res() res: Response) {
//     const result = this.authService.logout();
//     res.clearCookie('token');
//     return res.status(200).json(result);
//   }
// }

import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
  Req,
  Res,
  UsePipes,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { CreateAuthDto } from './dto/create-auth.dto';
import { AuthGuard } from './auth.guard';
import type { Response, Request } from 'express';
import { SanitizePipe } from 'src/common/pipes/sanitize.pipe';

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
  @UsePipes(new SanitizePipe())
  @Post('register')
  register(@Body() createAuthDto: CreateAuthDto) {
    return this.authService.create(createAuthDto);
  }

  // 🔹 Login endpoint, XSS sanitization bilan
  @UsePipes(new SanitizePipe())
  @Post('login')
  login(
    @Body() loginDto: { username: string; password: string },
    @Res() res: Response,
  ) {
    return this.authService.login(loginDto, res);
  }

  // 🔹 Logout endpoint, faqat auth guard bilan
  @Post('logout')
  @UseGuards(AuthGuard)
  logout(@Res() res: Response) {
    const result = this.authService.logout();
    res.clearCookie('refresh_token'); // token cookie-ni tozalash
    return res.status(200).json(result);
  }
}
