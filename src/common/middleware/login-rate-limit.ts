// src/common/middleware/login-rate-limit.ts
import { RequestHandler } from 'express';
import rateLimit from 'express-rate-limit';

// Login uchun qat'iy limit: 5 urinish / 15 daqiqa
export const LoginRateLimit: RequestHandler = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts
  message: {
    status: 429,
    error: 'Too many login attempts, please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});
