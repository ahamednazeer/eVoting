import { Injectable, CanActivate, ExecutionContext, ForbiddenException, SetMetadata } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Reflector } from '@nestjs/core';

export const ROLES_KEY = 'roles';
export const Roles = (...roles: string[]) => SetMetadata(ROLES_KEY, roles);

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
    handleRequest(err: any, user: any, info: any) {
        if (err || !user) {
            console.log(` [SECURITY] JWT auth failed: ${info?.message || 'No token'}`);
            throw err || new ForbiddenException('Authentication required');
        }
        return user;
    }
}

@Injectable()
export class RolesGuard implements CanActivate {
    constructor(private reflector: Reflector) { }

    canActivate(context: ExecutionContext): boolean {
        const requiredRoles = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
            context.getHandler(),
            context.getClass(),
        ]);

        // If no roles specified, allow access
        if (!requiredRoles || requiredRoles.length === 0) {
            return true;
        }

        const request = context.switchToHttp().getRequest();
        const user = request.user;

        if (!user || !user.role) {
            console.log(` [SECURITY] Role check failed — no user/role in request`);
            throw new ForbiddenException('Access denied — authentication required');
        }

        if (!requiredRoles.includes(user.role)) {
            const ip = request.ip || request.connection?.remoteAddress || 'unknown';
            console.log(` [SECURITY] UNAUTHORIZED ACCESS ATTEMPT:
  → Endpoint: ${request.method} ${request.url}
  → User: ${JSON.stringify({ sub: user.sub, role: user.role })}
  → Required: ${requiredRoles.join(', ')}
  → IP: ${ip}
  → Time: ${new Date().toISOString()}`);
            throw new ForbiddenException('Access denied — insufficient privileges');
        }

        return true;
    }
}

// ═══════════════════════════════════════════════════════════════
// GUARD 3: AdminGuard (Convenience — combines JWT + ADMIN role)
// Use @UseGuards(AdminGuard) on any admin-only controller/route
// ═══════════════════════════════════════════════════════════════
@Injectable()
export class AdminGuard extends AuthGuard('jwt') {
    handleRequest(err: any, user: any, info: any, context: ExecutionContext) {
        if (err || !user) {
            console.log(` [SECURITY] Admin auth failed: ${info?.message || 'No token'}`);
            throw err || new ForbiddenException('Authentication required');
        }

        if (user.role !== 'ADMIN') {
            const req = context.switchToHttp().getRequest();
            const ip = req.ip || req.connection?.remoteAddress || 'unknown';
            console.log(` [SECURITY] NON-ADMIN ACCESS BLOCKED:
  → Endpoint: ${req.method} ${req.url}
  → User role: ${user.role} (ID: ${user.sub})
  → IP: ${ip}
  → Time: ${new Date().toISOString()}`);
            throw new ForbiddenException('Admin access only');
        }

        return user;
    }
}

@Injectable()
export class VoterGuard extends AuthGuard('jwt') {
    handleRequest(err: any, user: any, info: any, context: ExecutionContext) {
        if (err || !user) {
            throw err || new ForbiddenException('Voter authentication required');
        }

        if (user.role !== 'VOTER') {
            const req = context.switchToHttp().getRequest();
            const ip = req.ip || req.connection?.remoteAddress || 'unknown';
            console.log(` [SECURITY] NON-VOTER ACCESS BLOCKED:
  → Endpoint: ${req.method} ${req.url}
  → User role: ${user.role} (ID: ${user.sub})
  → IP: ${ip}
  → Time: ${new Date().toISOString()}`);
            throw new ForbiddenException('Voter access only');
        }

        return user;
    }
}
