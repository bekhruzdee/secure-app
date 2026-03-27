import { Injectable, NestMiddleware } from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';
import { SecurityEventsService } from 'src/security/security-events.service';
import { SecurityEventType } from 'src/security/security-event-type.enum';

@Injectable()
export class SecurityAttemptMiddleware implements NestMiddleware {
  constructor(private readonly securityEventsService: SecurityEventsService) {}

  private readonly xssPattern =
    /<\s*script|on\w+\s*=|javascript:|<\s*img|<\s*iframe/i;
  private readonly sqlInjectionPattern =
    /(\bUNION\b\s+\bSELECT\b|\bSELECT\b\s+.+\s+\bFROM\b|\bDROP\b\s+\bTABLE\b|\bINSERT\b\s+\bINTO\b|\bDELETE\b\s+\bFROM\b|--|;\s*(drop|select|insert|delete|update)|\bOR\b\s+1=1|\bAND\b\s+1=1)/i;

  async use(req: Request, res: Response, next: NextFunction): Promise<void> {
    const candidates = this.collectStrings([req.params, req.query, req.body]);

    for (const value of candidates) {
      if (this.xssPattern.test(value)) {
        await this.securityEventsService.logEvent({
          type: SecurityEventType.XSS,
          req,
          reason: 'Blocked by XSS detection middleware',
          payloadSnippet: value.slice(0, 500),
        });

        res.status(400).json({
          statusCode: 400,
          success: false,
          message: 'Potential XSS payload blocked',
        });
        return;
      }

      if (this.sqlInjectionPattern.test(value)) {
        await this.securityEventsService.logEvent({
          type: SecurityEventType.SQL_INJECTION,
          req,
          reason: 'Blocked by SQL injection detection middleware',
          payloadSnippet: value.slice(0, 500),
        });

        res.status(400).json({
          statusCode: 400,
          success: false,
          message: 'Potential SQL injection payload blocked',
        });
        return;
      }
    }

    next();
  }

  private collectStrings(values: unknown[]): string[] {
    const output: string[] = [];

    const traverse = (input: unknown): void => {
      if (input === null || input === undefined) {
        return;
      }

      if (typeof input === 'string') {
        output.push(input);
        return;
      }

      if (Array.isArray(input)) {
        for (const item of input) {
          traverse(item);
        }
        return;
      }

      if (typeof input === 'object') {
        for (const value of Object.values(input as Record<string, unknown>)) {
          traverse(value);
        }
      }
    };

    for (const value of values) {
      traverse(value);
    }

    return output;
  }
}
