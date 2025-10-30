// import { Module } from '@nestjs/common';
// import { JwtModule } from '@nestjs/jwt';
// import { ConfigModule } from '@nestjs/config';
// import { AuthService } from './auth.service';
// import { AuthController } from './auth.controller';
// import { TypeOrmModule } from '@nestjs/typeorm';
// import { User } from 'src/users/entities/user.entity';

// @Module({
//   imports: [
//     ConfigModule.forRoot(),
//     TypeOrmModule.forFeature([User]),
//     JwtModule.register({
//       secret: process.env.JWT_SECRET,
//       signOptions: { expiresIn: process.env.JWT_EXPIRES_IN  },
//     }),
//   ],
//   controllers: [AuthController],
//   providers: [AuthService],
// })
// export class AuthModule {}

import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { User } from 'src/users/entities/user.entity';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forFeature([User]),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('JWT_SECRET') || 'default_secret',
        signOptions: {
          expiresIn: (config.get<string>('JWT_EXPIRES_IN') as any) || '1h',
        },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService],
})
export class AuthModule {}
