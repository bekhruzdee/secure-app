import {
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { CreateAuthDto } from './dto/create-auth.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from 'src/users/entities/user.entity';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { Response } from 'express';
import { Role } from 'src/common/enums/role.enum';
import { randomUUID } from 'crypto';

type AuthPayload = {
  id: string;
  username: string;
  role: Role;
  tokenType: 'access' | 'refresh';
  tokenId?: string;
};

@Injectable()
export class AuthService {
  private readonly refreshSessions = new Map<string, string>();

  constructor(
    @InjectRepository(User) private readonly userRepository: Repository<User>,
    private jwtService: JwtService,
  ) {}

  private setAuthCookies(res: Response, accessToken: string, refreshToken: string): void {
    const isProduction = process.env.NODE_ENV === 'production';

    res.cookie('access_token', accessToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'lax',
      path: '/',
      maxAge: 15 * 60 * 1000,
    });

    res.cookie('refresh_token', refreshToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
  }

  private clearAuthCookies(res: Response): void {
    res.clearCookie('access_token', { path: '/', sameSite: 'lax' });
    res.clearCookie('refresh_token', { path: '/', sameSite: 'lax' });
  }

  private buildTokenSet(user: User, role: Role): {
    accessToken: string;
    refreshToken: string;
  } {
    const refreshTokenId = randomUUID();

    const accessPayload: AuthPayload = {
      id: user.id,
      username: user.username,
      role,
      tokenType: 'access',
    };
    const refreshPayload: AuthPayload = {
      id: user.id,
      username: user.username,
      role,
      tokenType: 'refresh',
      tokenId: refreshTokenId,
    };

    const accessToken = this.jwtService.sign(accessPayload, { expiresIn: '15m' });
    const refreshToken = this.jwtService.sign(refreshPayload, { expiresIn: '7d' });

    this.refreshSessions.set(user.id, refreshTokenId);

    return { accessToken, refreshToken };
  }

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

  async create(createAuthDto: CreateAuthDto) {
    const existingUser = await this.userRepository.findOne({
      where: [{ username: createAuthDto.username }],
    });

    if (existingUser) {
      throw new ConflictException('Username  already exists❌');
    }

    const user = this.userRepository.create();
    user.username = createAuthDto.username;
    user.password = await bcrypt.hash(createAuthDto.password, 10);

    await this.userRepository.save(user);
    return 'You are registered✅';
  }

  async login(loginDto: { username: string; password: string }, res: Response) {
    const user = await this.userRepository.findOneBy({
      username: loginDto.username,
    });
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }
    const checkPass = await bcrypt.compare(loginDto.password, user.password);
    if (!checkPass) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const resolvedRole = this.normalizeRole(user.role);
    const { accessToken, refreshToken } = this.buildTokenSet(user, resolvedRole);
    this.setAuthCookies(res, accessToken, refreshToken);

    const { password, ...userData } = user;
    return res.json({ userData, access_token: accessToken });
  }

  async refreshSession(refreshToken: string | undefined, res: Response) {
    if (!refreshToken) {
      throw new UnauthorizedException('Refresh token is missing');
    }

    let payload: AuthPayload;
    try {
      payload = await this.jwtService.verifyAsync<AuthPayload>(refreshToken, {
        secret: process.env.JWT_SECRET,
      });
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }

    if (payload.tokenType !== 'refresh' || !payload.tokenId) {
      throw new UnauthorizedException('Invalid refresh token payload');
    }

    const expectedTokenId = this.refreshSessions.get(payload.id);
    if (!expectedTokenId || expectedTokenId !== payload.tokenId) {
      this.refreshSessions.delete(payload.id);
      throw new UnauthorizedException('Refresh token revoked');
    }

    const user = await this.userRepository.findOneBy({ id: payload.id });
    if (!user) {
      this.refreshSessions.delete(payload.id);
      throw new UnauthorizedException('User not found');
    }

    const resolvedRole = this.normalizeRole(user.role);
    const tokenSet = this.buildTokenSet(user, resolvedRole);
    this.setAuthCookies(res, tokenSet.accessToken, tokenSet.refreshToken);

    return { success: true, access_token: tokenSet.accessToken };
  }

  logout(userId?: string, res?: Response): { message: string } {
    if (userId) {
      this.refreshSessions.delete(userId);
    }

    if (res) {
      this.clearAuthCookies(res);
    }

    return { message: 'Logout successfully✅' };
  }

  async getAllMyData(payload: any) {
    const user = await this.userRepository.findOne({
      where: { id: payload.id },
      select: ['id', 'username', 'role', 'createdAt', 'updatedAt'],
    });

    if (!user) {
      throw new NotFoundException('User Not Found');
    }

    user.role = this.normalizeRole(user.role);

    return user;
  }
}
