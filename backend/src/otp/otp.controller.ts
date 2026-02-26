import { Controller, Post, Body, Headers, ForbiddenException, Logger } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { OtpService } from './otp.service';
import { SendOtpDto, VerifyOtpDto } from '../dto';

// ═══════════════════════════════════════════════════════════════
// SECURITY: OTP Controller
// These endpoints MUST be open (voter hasn't authenticated yet).
// Protected by: CORS, Rate Limiting, API Key, OTP attempt lockout
// ═══════════════════════════════════════════════════════════════
@Controller('api/otp')
export class OtpController {
    private readonly logger = new Logger('OtpController');

    constructor(private otpService: OtpService) { }

    // Validate the API key if configured
    private validateApiKey(apiKey: string | undefined) {
        const expectedKey = process.env.OTP_API_KEY;
        if (expectedKey && apiKey !== expectedKey) {
            this.logger.warn(`[SECURITY] Invalid OTP API key attempt`);
            throw new ForbiddenException('Invalid API key');
        }
    }

    // SECURITY: 3 OTP requests per 60 seconds per IP
    @Throttle({ default: { limit: 3, ttl: 60000 } })
    @Post('send')
    sendOtp(
        @Body() body: SendOtpDto,
        @Headers('x-api-key') apiKey?: string,
    ) {
        this.validateApiKey(apiKey);
        return this.otpService.sendOtp(body.mobile);
    }

    // SECURITY: 5 verify attempts per 60 seconds per IP
    @Throttle({ default: { limit: 5, ttl: 60000 } })
    @Post('verify')
    verifyOtp(
        @Body() body: VerifyOtpDto,
        @Headers('x-api-key') apiKey?: string,
    ) {
        this.validateApiKey(apiKey);
        return this.otpService.verifyOtp(body.mobile, body.otp);
    }
}
