// src/common/filters/csrf.filter.ts
import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  Injectable,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { SecurityEventsService } from 'src/security/security-events.service';
import { SecurityEventType } from 'src/security/security-event-type.enum';

@Catch()
@Injectable()
export class CsrfExceptionFilter implements ExceptionFilter {
  constructor(private readonly securityEventsService: SecurityEventsService) {}

  catch(exception: any, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const res = ctx.getResponse<Response>();
    const req = ctx.getRequest<Request>();

    // 🛡️ Handle CSRF errors (missing or invalid token)
    if (exception && exception.code === 'EBADCSRFTOKEN') {
      void this.securityEventsService.logEvent({
        type: SecurityEventType.CSRF,
        req,
        reason: 'Blocked by CSRF protection',
      });

      console.error('⚠️ CSRF token is missing or invalid:', exception.message);

      return res.status(403).json({
        statusCode: 403,
        success: false,
        error: 'Forbidden',
        message:
          'CSRF token is missing or invalid. Please refresh the page and try again.',
        path: req.url,
      });
    }

    // 🔹 Handle standard NestJS HttpExceptions
    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const body = exception.getResponse();

      console.warn('⚠️ HttpException caught:', body);

      return res.status(status).json({
        statusCode: status,
        success: false,
        ...(typeof body === 'string' ? { message: body } : body),
        path: req.url,
      });
    }

    // 🔸 Handle all other unknown errors
    console.error('💥 Internal Server Error:', exception);

    return res.status(500).json({
      statusCode: 500,
      success: false,
      error: 'Internal Server Error',
      message: exception?.message || 'An unexpected error occurred.',
      path: req.url,
    });
  }
}
