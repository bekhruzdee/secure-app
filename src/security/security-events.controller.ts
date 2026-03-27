import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { SecurityEventsService } from './security-events.service';
import { AuthGuard } from 'src/auth/auth.guard';
import { Roles, RolesGuard } from 'src/auth/role.guard';
import { Role } from 'src/common/enums/role.enum';

@Controller('admin/metrics')
@UseGuards(AuthGuard, RolesGuard)
@Roles(Role.ADMIN, Role.MANAGER)
export class SecurityEventsController {
  constructor(private readonly securityEventsService: SecurityEventsService) {}

  @Get('summary')
  async getSummary(@Query('days') days = '7') {
    const result = await this.securityEventsService.getSummary(Number(days));
    console.log(`📊 Summary API called with days=${days}`, result);
    return result;
  }

  @Get('timeline')
  async getTimeline(
    @Query('days') days = '7',
    @Query('groupBy') groupBy: 'hour' | 'day' = 'day',
  ) {
    const result = await this.securityEventsService.getTimeline(
      Number(days),
      groupBy,
    );
    console.log(
      `📈 Timeline API called with days=${days}, groupBy=${groupBy}`,
      `rows=${result.length}`,
    );
    return result;
  }

  @Get('recent')
  async getRecent(@Query('limit') limit = '25') {
    const result = await this.securityEventsService.getRecent(Number(limit));
    console.log(
      `🕐 Recent API called with limit=${limit}`,
      `events=${result.length}`,
    );
    return result;
  }

  @Get('detailed-stats')
  async getDetailedStats(@Query('days') days = '7') {
    const result = await this.securityEventsService.getDetailedStats(
      Number(days),
    );
    console.log(`📋 Detailed stats API called with days=${days}`, {
      totalEvents: result.totalEvents,
      typeCount: result.typeDistribution.length,
      topPaths: result.topPaths.length,
      topIps: result.topIps.length,
    });
    return result;
  }
}
