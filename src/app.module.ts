import { MiddlewareConsumer, Module, NestModule, RequestMethod } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { User } from './users/entities/user.entity';
import { SecurityEvent } from './security/security-event.entity';
import { SecurityEventsModule } from './security/security-events.module';
import { SecurityAttemptMiddleware } from './common/middleware/security-attempt.middleware';
import { CsrfExceptionFilter } from './common/filters/csrf.filter';
import { LoginRateLimit } from './common/middleware/login-rate-limit';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),

    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get<string>('DB_HOST'),
        port: configService.get<number>('DB_PORT'),
        username: configService.get<string>('DB_USERNAME'),
        password: configService.get<string>('DB_PASSWORD'),
        database: configService.get<string>('DB_DATABASE'),
        entities: [User, SecurityEvent],
        synchronize: false,
      }),
    }),

    AuthModule,
    UsersModule,
    SecurityEventsModule,
  ],
  controllers: [AppController],
  providers: [AppService, CsrfExceptionFilter, SecurityAttemptMiddleware],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(LoginRateLimit)
      .forRoutes({ path: 'auth/login', method: RequestMethod.POST });

    consumer
      .apply(SecurityAttemptMiddleware)
      .exclude({ path: 'auth/csrf-token', method: RequestMethod.GET })
      .forRoutes({ path: '*', method: RequestMethod.ALL });
  }
}
