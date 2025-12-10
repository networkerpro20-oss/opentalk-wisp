import { Injectable, NestMiddleware, UnauthorizedException } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { PrismaService } from '../../prisma/prisma.service';

declare global {
  namespace Express {
    interface Request {
      organizationId?: string;
    }
  }
}

@Injectable()
export class TenantMiddleware implements NestMiddleware {
  constructor(private prisma: PrismaService) {}

  async use(req: Request, res: Response, next: NextFunction) {
    // Extraer organizationId del usuario autenticado
    const user = (req as any).user;

    if (user && user.organizationId) {
      req.organizationId = user.organizationId;
      
      // Verificar que la organización existe y está activa
      const org = await this.prisma.organization.findUnique({
        where: { id: user.organizationId },
      });

      if (!org || org.status === 'SUSPENDED' || org.status === 'CANCELLED') {
        throw new UnauthorizedException('Organization not accessible');
      }
    }

    next();
  }
}
