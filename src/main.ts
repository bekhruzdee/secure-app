import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import cookieParser from 'cookie-parser';
import { CsrfExceptionFilter } from './common/filters/csrf.filter';
import { ValidationPipe } from '@nestjs/common';
import { SanitizePipe } from './common/pipes/sanitize.pipe';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';

// ⚠️ csurf CommonJS moduli, shuning uchun require ishlatiladi
const csurf = require('csurf');

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  const rawCorsOrigins = process.env.CORS_ORIGINS || 'http://localhost:3000';
  const allowedCorsOrigins = rawCorsOrigins
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

  const isDev = process.env.NODE_ENV !== 'production';

  app.enableCors({
    origin: (origin, callback) => {
      if (!origin) {
        callback(null, true);
        return;
      }

      if (allowedCorsOrigins.includes(origin)) {
        callback(null, true);
        return;
      }

      if (
        isDev &&
        (origin.includes('localhost') || origin.includes('127.0.0.1'))
      ) {
        callback(null, true);
        return;
      }

      const msg = `CORS rejected (prod=${!isDev}) origin=${origin}, allowed=${allowedCorsOrigins.join(',')}`;
      console.warn(msg);
      callback(null, false);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'CSRF-Token'],
  });

  // 🛡 Helmet — HTTP xavfsizlik headerlari
  app.use(helmet());

  // 🚫 Rate limiting — DDoS/brute-force himoyasi
  app.use(
    rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      limit: 100, // 100 requests per 15 min per IP
      message: 'Too many requests, please try again later.',
    }),
  );

  // 🍪 Cookie parser — cookie o‘qish uchun
  app.use(cookieParser());

  // 🧿 CSRF himoya — token cookie orqali
  // CSRF_ENABLED=false bo'lsa to'liq o'chadi.
  const csrfEnabled = process.env.CSRF_ENABLED !== 'false';
  const isProduction = process.env.NODE_ENV === 'production';
  if (csrfEnabled) {
    const csrfProtection = csurf({
      cookie: {
        key: '_csrf',
        httpOnly: true,
        sameSite: 'lax',
        secure: isProduction,
      },
    });

    app.use((req, res, next) => {
      // Login endpoint uchun CSRF tekshiruvini o'tkazib yuboramiz.
      if (req.method === 'POST' && req.path === '/auth/login') {
        return next();
      }

      return csrfProtection(req, res, next);
    });
  }

  // Serve frontend admin panel in monolith mode.
  app.useStaticAssets(join(process.cwd(), 'frontend'), {
    prefix: '/panel/',
  });

  // 🔹 NestJS ExceptionFilter with DI
  app.useGlobalFilters(app.get(CsrfExceptionFilter));

  app.useGlobalPipes(
    new SanitizePipe(), // 1) XSS sanitizatsiya
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      stopAtFirstError: true,
      transform: true,
    }),
  );

  const PORT = process.env.PORT || 3000;
  await app.listen(PORT);
  console.log(`🚀 Server running on http://localhost:${PORT}`);
}

bootstrap();
