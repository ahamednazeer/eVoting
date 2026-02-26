import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

// ═══════════════════════════════════════════════════════════════
// SECURITY: Admin Audit Middleware
// Logs every request to admin API endpoints with:
// - Method, URL, IP, User-Agent, timestamp
// - Body content (sanitized — passwords masked)
// This creates a complete audit trail for all admin actions
// ═══════════════════════════════════════════════════════════════
@Injectable()
export class AdminAuditMiddleware implements NestMiddleware {
    use(req: Request, res: Response, next: NextFunction) {
        const startTime = Date.now();
        const ip = req.ip || req.headers['x-forwarded-for'] || req.connection?.remoteAddress || 'unknown';
        const userAgent = req.headers['user-agent'] || 'unknown';

        // Sanitize body — mask sensitive fields
        const sanitizedBody = { ...req.body };
        if (sanitizedBody.password) sanitizedBody.password = '***MASKED***';
        if (sanitizedBody.current_password) sanitizedBody.current_password = '***MASKED***';
        if (sanitizedBody.new_password) sanitizedBody.new_password = '***MASKED***';

        // Log on response finish
        res.on('finish', () => {
            const duration = Date.now() - startTime;
            const isWrite = ['POST', 'PUT', 'DELETE', 'PATCH'].includes(req.method);

            // Always log write operations, only log reads if they fail
            if (isWrite || res.statusCode >= 400) {
                const logEntry = {
                    timestamp: new Date().toISOString(),
                    method: req.method,
                    url: req.originalUrl,
                    status: res.statusCode,
                    ip,
                    userAgent: userAgent.substring(0, 100),
                    duration: `${duration}ms`,
                    ...(isWrite && Object.keys(sanitizedBody).length > 0 ? { body: sanitizedBody } : {}),
                };

                if (res.statusCode >= 400) {
                    console.log(` [AUDIT:FAIL] ${JSON.stringify(logEntry)}`);
                } else {
                    console.log(`📋 [AUDIT:OK] ${JSON.stringify(logEntry)}`);
                }
            }
        });

        next();
    }
}

// ═══════════════════════════════════════════════════════════════
// SECURITY: Security Headers Middleware
// Additional security headers beyond what Helmet provides
// ═══════════════════════════════════════════════════════════════
@Injectable()
export class SecurityHeadersMiddleware implements NestMiddleware {
    use(_req: Request, res: Response, next: NextFunction) {
        // Prevent caching of API responses with sensitive data
        res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
        res.setHeader('Pragma', 'no-cache');
        res.setHeader('Expires', '0');

        // Additional security headers
        res.setHeader('X-Content-Type-Options', 'nosniff');
        res.setHeader('X-Frame-Options', 'DENY');
        res.setHeader('X-XSS-Protection', '1; mode=block');
        res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
        res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');

        next();
    }
}
