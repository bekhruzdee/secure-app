// import { Module } from '@nestjs/common';
// import { UsersService } from './users.service';
// import { UsersController } from './users.controller';
// import { TypeOrmModule } from '@nestjs/typeorm';
// import { User } from './entities/user.entity';
// import { JwtModule } from '@nestjs/jwt';

// @Module({
//   imports: [
//     TypeOrmModule.forFeature([User]),
//     JwtModule.register({
//       global: true,
//       secret: process.env.JWT_SECRET,
//       signOptions: { expiresIn: process.env.JWT_EXPIRATION },
//     }),
//   ],
//   controllers: [UsersController],
//   providers: [UsersService],
//   exports: [UsersService],
// })
// export class UsersModule {}

import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { User } from './entities/user.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([User]),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        global: true,
        secret: config.get<string>('JWT_SECRET') || 'default_secret',
        signOptions: {
          expiresIn:
            (config.get<string>('JWT_REFRESH_EXPIRES_IN') as any) || '7d',
        },
      }),
    }),
  ],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
