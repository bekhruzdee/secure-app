import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';
import * as dotenv from 'dotenv';
import { Role } from 'src/common/enums/role.enum';
dotenv.config();

type AuthPayload = {
  id: string;
  username: string;
  role: Role;
  tokenType?: 'access' | 'refresh';
  iat?: number;
  exp?: number;
};

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private jwtService: JwtService) {}

  private normalizeRole(currentRole?: string): Role {
    const role = String(currentRole || '').toLowerCase();

    if (role === Role.ADMIN) {
      return Role.ADMIN;
    }

    if (role === Role.MANAGER) {
      return Role.MANAGER;
    }

    return Role.USER;
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const authHeader = request.headers.authorization;
    const tokenFromCookie = request.cookies?.access_token as string | undefined;

    let token = tokenFromCookie;
    if (authHeader) {
      const [type, bearerToken] = authHeader.split(' ');
      if (type !== 'Bearer' || !bearerToken) {
        throw new UnauthorizedException('Invalid authorization format');
      }
      token = bearerToken;
    }

    if (!token) {
      throw new UnauthorizedException('Access token is missing');
    }

    try {
      const payload = await this.jwtService.verifyAsync<AuthPayload>(token, {
        secret: process.env.JWT_SECRET,
      });

      if (payload.tokenType && payload.tokenType !== 'access') {
        throw new UnauthorizedException('Invalid access token type');
      }

      const { iat, exp, ...userData } = payload;
      userData.role = this.normalizeRole(userData.role);
      request['user'] = userData;
    } catch (error) {
      throw new UnauthorizedException('Invalid token or token expired');
    }

    return true;
  }
}
