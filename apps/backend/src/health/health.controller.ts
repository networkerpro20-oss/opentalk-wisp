import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { HealthCheck, HealthCheckService, PrismaHealthIndicator } from '@nestjs/terminus';
import { PrismaService } from '../prisma/prisma.service';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

@ApiTags('Health')
@Controller('health')
export class HealthController {
  constructor(
    private health: HealthCheckService,
    private prismaHealth: PrismaHealthIndicator,
    private prisma: PrismaService,
    private configService: ConfigService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Health check endpoint for monitoring' })
  async check() {
    try {
      const checks = await this.health.check([
        () => this.prismaHealth.pingCheck('database', this.prisma),
      ]);
      
      // Add Redis check separately (non-blocking)
      const redisStatus = await this.checkRedis();
      const memoryStatus = await this.checkMemory();
      
      return {
        ...checks,
        info: {
          ...checks.info,
          ...redisStatus,
          ...memoryStatus,
        },
      };
    } catch (error) {
      return {
        status: 'error',
        info: {
          database: {
            status: 'down',
            error: error.message,
          },
        },
      };
    }
  }

  @Get('simple')
  @ApiOperation({ summary: 'Simple health check without dependencies' })
  simpleCheck() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development',
    };
  }

  private async checkRedis() {
    try {
      const redisUrl = this.configService.get<string>('REDIS_URL');
      if (!redisUrl) {
        return { redis: { status: 'down', error: 'REDIS_URL not configured' } };
      }
      const client = new Redis(redisUrl, { connectTimeout: 3000, lazyConnect: true });
      await client.connect();
      await client.ping();
      await client.quit();
      return { redis: { status: 'up' } };
    } catch (error) {
      return { redis: { status: 'down', error: error.message } };
    }
  }

  private async checkMemory() {
    const used = process.memoryUsage();
    const heapUsedMB = Math.round(used.heapUsed / 1024 / 1024);
    const heapTotalMB = Math.round(used.heapTotal / 1024 / 1024);
    
    return {
      memory: {
        status: heapUsedMB < 500 ? 'up' : 'down',
        heapUsed: `${heapUsedMB} MB`,
        heapTotal: `${heapTotalMB} MB`,
      },
    };
  }

  private async checkDisk() {
    // TODO: Implementar check de disco si es necesario
    return {
      disk: {
        status: 'up',
      },
    };
  }
}
