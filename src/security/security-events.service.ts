import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Request } from 'express';
import { SecurityEvent } from './security-event.entity';
import { SecurityEventType } from './security-event-type.enum';
import { User } from 'src/users/entities/user.entity';

@Injectable()
export class SecurityEventsService {
  constructor(
    @InjectRepository(SecurityEvent)
    private readonly securityEventsRepository: Repository<SecurityEvent>,
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
  ) {}

  async logEvent(input: {
    type: SecurityEventType;
    req: Request;
    reason?: string;
    payloadSnippet?: string;
  }): Promise<void> {
    try {
      const ip =
        (input.req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ||
        input.req.ip ||
        null;

      const securityEvent = this.securityEventsRepository.create({
        type: input.type,
        ip,
        method: input.req.method,
        path: input.req.originalUrl || input.req.url,
        userAgent: input.req.headers['user-agent'] || null,
        reason: input.reason || null,
        payloadSnippet: input.payloadSnippet || null,
      });

      await this.securityEventsRepository.save(securityEvent);
    } catch (error) {
      // Logging must never break request handling flow.
      console.error('Failed to persist security event:', error?.message || error);
    }
  }

  async getSummary(days: number) {
    const safeDays = Number.isFinite(days) && days > 0 ? days : 7;
    const from = new Date();
    from.setDate(from.getDate() - safeDays);

    const countByTypeSince = async (type: SecurityEventType): Promise<number> => {
      return this.securityEventsRepository
        .createQueryBuilder('event')
        .where('event.type = :type', { type })
        .andWhere('event.created_at >= :from', { from })
        .getCount();
    };

    const [totalUsers, blockedXss, blockedCsrf, blockedSqlInjection] = await Promise.all([
      this.usersRepository.count(),
      countByTypeSince(SecurityEventType.XSS),
      countByTypeSince(SecurityEventType.CSRF),
      countByTypeSince(SecurityEventType.SQL_INJECTION),
    ]);

    return {
      rangeDays: safeDays,
      totalUsers,
      blocked: {
        xss: blockedXss,
        csrf: blockedCsrf,
        sqlInjection: blockedSqlInjection,
      },
    };
  }

  async getTimeline(days: number, groupBy: 'hour' | 'day') {
    const safeDays = Number.isFinite(days) && days > 0 ? days : 7;
    const safeGroupBy = groupBy === 'hour' ? 'hour' : 'day';
    const from = new Date();
    from.setDate(from.getDate() - safeDays);

    const bucketExpr = `date_trunc('${safeGroupBy}', event.created_at)`;

    const rows = await this.securityEventsRepository
      .createQueryBuilder('event')
      .select(`${bucketExpr}`, 'bucket')
      .addSelect('event.type', 'type')
      .addSelect('COUNT(*)', 'count')
      .where('event.created_at >= :from', { from })
      .groupBy(bucketExpr)
      .addGroupBy('event.type')
      .orderBy('bucket', 'ASC')
      .getRawMany();

    return rows.map((row) => ({
      bucket: row.bucket,
      type: row.type,
      count: Number(row.count),
    }));
  }

  async getRecent(limit: number) {
    const safeLimit = Number.isFinite(limit) && limit > 0 ? Math.min(limit, 100) : 25;

    const events = await this.securityEventsRepository.find({
      order: { createdAt: 'DESC' },
      take: safeLimit,
    });

    return events.map((event) => ({
      id: event.id,
      type: event.type,
      ip: event.ip,
      path: event.path,
      method: event.method,
      reason: event.reason,
      createdAt: event.createdAt,
    }));
  }

  async getDetailedStats(days: number) {
    const safeDays = Number.isFinite(days) && days > 0 ? days : 7;
    const from = new Date();
    from.setDate(from.getDate() - safeDays);

    const typeDistribution = await this.securityEventsRepository
      .createQueryBuilder('event')
      .select('event.type', 'type')
      .addSelect('COUNT(*)', 'count')
      .where('event.created_at >= :from', { from })
      .groupBy('event.type')
      .getRawMany();

    const topPaths = await this.securityEventsRepository
      .createQueryBuilder('event')
      .select('event.path', 'path')
      .addSelect('COUNT(*)', 'count')
      .where('event.created_at >= :from', { from })
      .groupBy('event.path')
      .orderBy('count', 'DESC')
      .limit(5)
      .getRawMany();

    const topIps = await this.securityEventsRepository
      .createQueryBuilder('event')
      .select('event.ip', 'ip')
      .addSelect('COUNT(*)', 'count')
      .where('event.created_at >= :from', { from })
      .andWhere('event.ip IS NOT NULL')
      .groupBy('event.ip')
      .orderBy('count', 'DESC')
      .limit(5)
      .getRawMany();

    const totalEvents = await this.securityEventsRepository
      .createQueryBuilder('event')
      .where('event.created_at >= :from', { from })
      .getCount();

    return {
      rangeDays: safeDays,
      totalEvents,
      typeDistribution: typeDistribution.map((row) => ({
        type: row.type,
        count: Number(row.count),
      })),
      topPaths: topPaths.map((row) => ({
        path: String(row.path).substring(0, 100),
        count: Number(row.count),
      })),
      topIps: topIps.map((row) => ({
        ip: row.ip || 'unknown',
        count: Number(row.count),
      })),
    };
  }
}
