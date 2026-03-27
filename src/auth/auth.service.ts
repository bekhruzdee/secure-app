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

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User) private readonly userRepository: Repository<User>,
    private jwtService: JwtService,
  ) {}

  private resolveRoleByUsername(username: string, currentRole?: string): string {
    const normalizedUsername = String(username || '').trim().toLowerCase();
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

    const resolvedRole = this.resolveRoleByUsername(user.username, user.role);
    if (user.role !== resolvedRole) {
      user.role = resolvedRole;
      await this.userRepository.save(user);
    }

    const payload = { id: user.id, username: user.username, role: resolvedRole };
    const accessToken = this.jwtService.sign(payload, { expiresIn: '1d' });
    const refreshToken = this.jwtService.sign(payload, { expiresIn: '7d' });

    res.cookie('refresh_token', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    const { password, ...userData } = user;
    return res.json({ userData, access_token: accessToken });
  }

  logout(): { message: string } {
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

    const resolvedRole = this.resolveRoleByUsername(user.username, user.role);
    if (user.role !== resolvedRole) {
      user.role = resolvedRole;
      await this.userRepository.save(user);
    }

    return user;
  }
}
