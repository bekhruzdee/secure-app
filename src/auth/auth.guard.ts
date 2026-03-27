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

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private jwtService: JwtService) {}

  private resolveRoleByUsername(
    username: string,
    currentRole?: string,
  ): string {
    const normalizedUsername = String(username || '')
      .trim()
      .toLowerCase();
    const superAdminFromEnv = String(
      process.env.SUPER_ADMIN_USERNAME ?? process.env.SUPERADMIN_USERNAME ?? '',
    )
      .trim()
      .toLowerCase();
    const managerFromEnv = String(process.env.MANAGER_USERNAME ?? '')
      .trim()
      .toLowerCase();

    if (normalizedUsername && normalizedUsername === superAdminFromEnv) {
      return Role.ADMIN;
    }

    if (normalizedUsername && normalizedUsername === managerFromEnv) {
      return Role.MANAGER;
    }

    return currentRole || 'user';
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const authHeader = request.headers.authorization;

    if (!authHeader) {
      throw new UnauthorizedException('Authorization header is missing');
    }

    const [type, token] = authHeader.split(' ');

    if (type !== 'Bearer' || !token) {
      throw new UnauthorizedException('Invalid authorization format');
    }

    try {
      const payload = await this.jwtService.verify(token, {
        secret: process.env.JWT_SECRET,
      });

      const { iat, exp, ...userData } = payload;
      userData.role = this.resolveRoleByUsername(
        userData.username,
        userData.role,
      );
      request['user'] = userData;
    } catch (error) {
      throw new UnauthorizedException('Invalid token or token expired');
    }

    return true;
  }
}
