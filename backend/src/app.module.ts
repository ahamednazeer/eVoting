import { Module, MiddlewareConsumer, NestModule, RequestMethod } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { AuthModule } from './auth/auth.module';
import { ElectionsModule } from './elections/elections.module';
import { CandidatesModule } from './candidates/candidates.module';
import { VotersModule } from './voters/voters.module';
import { OtpModule } from './otp/otp.module';
import { VotingModule } from './voting/voting.module';
import { ResultsModule } from './results/results.module';
import { Admin, Election, Candidate, Voter, Otp, Vote } from './entities';
import { AdminAuditMiddleware, SecurityHeadersMiddleware } from './middleware/security.middleware';
import { SmsModule } from './sms/sms.module';

@Module({
  imports: [
    // Load .env config
    ConfigModule.forRoot({ isGlobal: true }),

    // ═══════════════════════════════════════════
    // SECURITY: Global rate limiting
    // 100 requests per 60 seconds per IP
    // Individual endpoints override with @Throttle()
    // ═══════════════════════════════════════════
    ThrottlerModule.forRoot([{
      ttl: 60000,
      limit: 100,
    }]),

    TypeOrmModule.forRoot({
      type: 'better-sqlite3',
      database: process.env.DB_PATH || 'evoting.db',
      entities: [Admin, Election, Candidate, Voter, Otp, Vote],
      synchronize: true,
      extra: { busyTimeout: 5000 },
    }),
    AuthModule,
    ElectionsModule,
    CandidatesModule,
    VotersModule,
    OtpModule,
    VotingModule,
    ResultsModule,
    SmsModule,
  ],
  providers: [
    // ═══════════════════════════════════════════
    // SECURITY: Enable ThrottlerGuard GLOBALLY
    // Every endpoint is rate-limited by default
    // ═══════════════════════════════════════════
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule implements NestModule {
  // ═══════════════════════════════════════════
  // SECURITY: Apply middlewares
  // ═══════════════════════════════════════════
  configure(consumer: MiddlewareConsumer) {
    // Security headers on ALL routes
    consumer
      .apply(SecurityHeadersMiddleware)
      .forRoutes({ path: '{*path}', method: RequestMethod.ALL });

    // Audit logging on ALL admin endpoints
    consumer
      .apply(AdminAuditMiddleware)
      .forRoutes(
        { path: 'api/elections/{*path}', method: RequestMethod.ALL },
        { path: 'api/elections', method: RequestMethod.ALL },
        { path: 'api/candidates/{*path}', method: RequestMethod.ALL },
        { path: 'api/candidates', method: RequestMethod.ALL },
        { path: 'api/voters/{*path}', method: RequestMethod.ALL },
        { path: 'api/voters', method: RequestMethod.ALL },
        { path: 'api/results/{*path}', method: RequestMethod.ALL },
        { path: 'api/results', method: RequestMethod.ALL },
        { path: 'api/auth/{*path}', method: RequestMethod.ALL },
        { path: 'api/auth', method: RequestMethod.ALL },
      );
  }
}
