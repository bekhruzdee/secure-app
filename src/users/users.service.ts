// import { Injectable, NotFoundException } from '@nestjs/common';
// import { InjectRepository } from '@nestjs/typeorm';
// import { Repository } from 'typeorm';
// import { User } from './entities/user.entity';
// import { UpdateUserDto } from './dto/update-user.dto';
// import { CreateAdminDto } from './dto/create-admin.dto';
// import * as bcrypt from 'bcrypt';
// import { plainToInstance } from 'class-transformer';

// @Injectable()
// export class UsersService {
//   constructor(
//     @InjectRepository(User)
//     private usersRepository: Repository<User>,
//   ) {}

//   async createAdmin(
//     createAdminDto: CreateAdminDto,
//   ): Promise<{ success: boolean; message: string; data?: User }> {
//     const existingUser = await this.usersRepository.findOne({
//       where: { username: createAdminDto.username },
//     });

//     if (existingUser) {
//       return {
//         success: false,
//         message: 'User already exists❌',
//       };
//     }

//     const hashedPassword = await bcrypt.hash(createAdminDto.password, 10);

//     const newAdmin = this.usersRepository.create({
//       ...createAdminDto,
//       password: hashedPassword,
//     });

//     const savedAdmin = await this.usersRepository.save(newAdmin);

//     return {
//       success: true,
//       message: 'Admin created successfully✅',
//       data: savedAdmin,
//     };
//   }

//   async getUserCount(): Promise<{ total: number }> {
//     const total = await this.usersRepository.count();
//     return { total };
//   }

//   async findAll(): Promise<{
//     success: boolean;
//     message: string;
//     data: Omit<User, 'password'>[];
//   }> {
//     const users = await this.usersRepository.find({
//       select: ['id', 'username', 'role', 'createdAt', 'updatedAt'],
//     });
//     return {
//       success: true,
//       message: 'Users data retrieved successfully✅',
//       data: users,
//     };
//   }

//   async findOne(id: string): Promise<Omit<User, 'password'>> {
//     const user = await this.usersRepository.findOne({
//       where: { id },
//       select: ['id', 'username', 'role', 'createdAt', 'updatedAt'],
//     });

//     if (!user) {
//       throw new NotFoundException(`User with ID ${id} not found❌`);
//     }

//     return user;
//   }

//   async update(
//     userId: string,
//     updateUserDto: UpdateUserDto,
//   ): Promise<{ success: boolean; message: string; data?: User }> {
//     const existingUser = await this.usersRepository.findOne({
//       where: { id: userId },
//     });

//     if (!existingUser) {
//       return {
//         success: false,
//         message: 'User not found⚠️',
//       };
//     }

//     if (updateUserDto.password) {
//       const hashedPassword = await bcrypt.hash(updateUserDto.password, 10);
//       updateUserDto.password = hashedPassword;
//     }

//     const updatedUser = await this.usersRepository.save({
//       ...existingUser,
//       ...updateUserDto,
//     });

//     return {
//       success: true,
//       message: 'User updated successfully✅',
//       data: plainToInstance(User, updatedUser),
//     };
//   }

//   async remove(userId: string): Promise<{ success: boolean; message: string }> {
//     const existingUser = await this.usersRepository.findOne({
//       where: { id: userId },
//     });

//     if (!existingUser) {
//       return {
//         success: false,
//         message: 'User not found⚠️',
//       };
//     }

//     await this.usersRepository.delete(userId);

//     return {
//       success: true,
//       message: 'User deleted successfully✅',
//     };
//   }
// }

import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { UpdateUserDto } from './dto/update-user.dto';
import { CreateAdminDto } from './dto/create-admin.dto';
import * as bcrypt from 'bcrypt';
import { plainToInstance } from 'class-transformer';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  // SQL Injection himoya bilan username bo‘yicha qidirish
  async findOneByUsername(username: string): Promise<User | null> {
    return await this.usersRepository
      .createQueryBuilder('u')
      .where('u.username = :username', { username })
      .getOne();
  }

  async createAdmin(
    createAdminDto: CreateAdminDto,
  ): Promise<{ success: boolean; message: string; data?: User }> {
    const existingUser = await this.findOneByUsername(createAdminDto.username);

    if (existingUser) {
      return {
        success: false,
        message: 'User already exists❌',
      };
    }

    const hashedPassword = await bcrypt.hash(createAdminDto.password, 10);

    const newAdmin = this.usersRepository.create({
      ...createAdminDto,
      password: hashedPassword,
    });

    const savedAdmin = await this.usersRepository.save(newAdmin);

    return {
      success: true,
      message: 'Admin created successfully✅',
      data: savedAdmin,
    };
  }

  async getUserCount(): Promise<{ total: number }> {
    const total = await this.usersRepository.count();
    return { total };
  }

  async findAll(): Promise<{
    success: boolean;
    message: string;
    data: Omit<User, 'password'>[];
  }> {
    const users = await this.usersRepository.find({
      select: ['id', 'username', 'role', 'createdAt', 'updatedAt'],
    });
    return {
      success: true,
      message: 'Users data retrieved successfully✅',
      data: users,
    };
  }

  async findOne(id: string): Promise<Omit<User, 'password'>> {
    const user = await this.usersRepository.findOne({
      where: { id },
      select: ['id', 'username', 'role', 'createdAt', 'updatedAt'],
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found❌`);
    }

    return user;
  }

  async update(
    userId: string,
    updateUserDto: UpdateUserDto,
  ): Promise<{ success: boolean; message: string; data?: User }> {
    const existingUser = await this.usersRepository.findOne({
      where: { id: userId },
    });

    if (!existingUser) {
      return {
        success: false,
        message: 'User not found⚠️',
      };
    }

    if (updateUserDto.password) {
      const hashedPassword = await bcrypt.hash(updateUserDto.password, 10);
      updateUserDto.password = hashedPassword;
    }

    const updatedUser = await this.usersRepository.save({
      ...existingUser,
      ...updateUserDto,
    });

    return {
      success: true,
      message: 'User updated successfully✅',
      data: plainToInstance(User, updatedUser),
    };
  }

  async remove(userId: string): Promise<{ success: boolean; message: string }> {
    const existingUser = await this.usersRepository.findOne({
      where: { id: userId },
    });

    if (!existingUser) {
      return {
        success: false,
        message: 'User not found⚠️',
      };
    }

    await this.usersRepository.delete(userId);

    return {
      success: true,
      message: 'User deleted successfully✅',
    };
  }
}
