import { CallHandler, ExecutionContext, Injectable, Logger, NestInterceptor } from '@nestjs/common';
import { Observable, tap } from 'rxjs';
import { PrismaService } from '../../prisma/prisma.service';

const WRITE_METHODS = ['POST', 'PUT', 'PATCH', 'DELETE'];
// Never persist secrets in the audit trail
const SKIP_PATHS = ['/auth/'];
const SENSITIVE_KEYS = ['password', 'passwordHash', 'accessToken', 'refreshToken', 'token'];

function scrub(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(scrub);
  if (value && typeof value === 'object' && !(value instanceof Date)) {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .filter(([k]) => !SENSITIVE_KEYS.includes(k))
        .map(([k, v]) => [k, scrub(v)]),
    );
  }
  return value;
}

/**
 * Global interceptor: records every successful write (POST/PUT/PATCH/DELETE)
 * made by an authenticated user into the AuditLog table.
 */
@Injectable()
export class AuditInterceptor implements NestInterceptor {
  private readonly logger = new Logger(AuditInterceptor.name);

  constructor(private prisma: PrismaService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest();
    const { method, user, ip } = request;
    const path: string = request.path ?? request.url ?? '';

    if (!WRITE_METHODS.includes(method) || !user || SKIP_PATHS.some((p) => path.includes(p))) {
      return next.handle();
    }

    // path looks like /api/v1/<entity>/<id>/...
    const segments = path.split('/').filter(Boolean);
    const entity = segments[2] ?? 'unknown';

    return next.handle().pipe(
      tap((data: any) => {
        const entityId = request.params?.id ?? data?.id ?? 'n/a';
        this.prisma.auditLog
          .create({
            data: {
              action: method,
              entity,
              entityId: String(entityId),
              newValues: method === 'DELETE' ? undefined : (scrub(request.body) as any),
              ipAddress: ip,
              userId: user.id,
            },
          })
          .catch((err) => this.logger.warn(`Audit log failed: ${err.message}`));
      }),
    );
  }
}
