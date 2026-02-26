import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

// ═══════════════════════════════════════════════════════════════
// SMS SERVICE
// Supports: Twilio, Fast2SMS, or Console-only (dev mode)
//
// SECURITY: OTP values are NEVER logged. Only delivery
// status (success/failure) is recorded in audit logs.
// ═══════════════════════════════════════════════════════════════

@Injectable()
export class SmsService {
    private readonly logger = new Logger('SmsService');
    private provider: string;

    constructor(private configService: ConfigService) {
        this.provider = this.configService.get<string>('SMS_PROVIDER', 'console');
        this.logger.log(`SMS provider configured: ${this.provider}`);
    }

    async sendOtp(mobile: string, otpCode: string): Promise<{ success: boolean; message: string }> {
        const smsBody = `Your eVoting OTP is ${otpCode}. Valid for 5 minutes. Do not share this code with anyone.`;

        try {
            switch (this.provider) {
                case 'twilio':
                    return await this.sendViaTwilio(mobile, smsBody);
                case 'fast2sms':
                    return await this.sendViaFast2Sms(mobile, otpCode);
                case 'console':
                default:
                    return this.sendViaConsole(mobile, otpCode);
            }
        } catch (error: any) {
            // SECURITY: Never log the OTP value in error messages
            this.logger.error(`SMS delivery failed for mobile: ${this.maskMobile(mobile)} — ${error.message}`);
            return { success: false, message: 'Failed to send SMS' };
        }
    }

    // ═══════════════════════════════════════════════════════════
    // TWILIO
    // ═══════════════════════════════════════════════════════════
    private async sendViaTwilio(mobile: string, body: string): Promise<{ success: boolean; message: string }> {
        const accountSid = this.configService.get<string>('TWILIO_ACCOUNT_SID');
        const authToken = this.configService.get<string>('TWILIO_AUTH_TOKEN');
        const fromNumber = this.configService.get<string>('TWILIO_PHONE_NUMBER');

        if (!accountSid || !authToken || !fromNumber) {
            throw new Error('Twilio credentials not configured in .env');
        }

        const twilio = require('twilio');
        const client = twilio(accountSid, authToken);

        const toNumber = mobile.startsWith('+') ? mobile : `+91${mobile}`;

        const message = await client.messages.create({
            body,
            from: fromNumber,
            to: toNumber,
        });

        // SECURITY: Only log delivery SID (no OTP content)
        this.logger.log(`[AUDIT] SMS sent via Twilio — SID: ${message.sid}, To: ${this.maskMobile(mobile)}`);

        return { success: true, message: 'OTP sent via SMS' };
    }

    // ═══════════════════════════════════════════════════════════
    // FAST2SMS (India)
    // ═══════════════════════════════════════════════════════════
    private async sendViaFast2Sms(mobile: string, otpCode: string): Promise<{ success: boolean; message: string }> {
        const apiKey = this.configService.get<string>('FAST2SMS_API_KEY');

        if (!apiKey) {
            throw new Error('Fast2SMS API key not configured in .env');
        }

        const response = await fetch('https://www.fast2sms.com/dev/bulkV2', {
            method: 'POST',
            headers: {
                'authorization': apiKey,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                route: 'otp',
                variables_values: otpCode,
                numbers: mobile,
                flash: 0,
            }),
        });

        const result = await response.json();

        if (!result.return) {
            throw new Error(result.message || 'Fast2SMS delivery failed');
        }

        // SECURITY: Only log success status (no OTP)
        this.logger.log(`[AUDIT] SMS sent via Fast2SMS — To: ${this.maskMobile(mobile)}, RequestId: ${result.request_id || 'N/A'}`);

        return { success: true, message: 'OTP sent via SMS' };
    }

    // ═══════════════════════════════════════════════════════════
    // CONSOLE (Dev mode only)
    // ═══════════════════════════════════════════════════════════
    private sendViaConsole(mobile: string, otpCode: string): { success: boolean; message: string } {
        if (process.env.NODE_ENV === 'production') {
            // SECURITY: In production, NEVER log OTP to console
            this.logger.warn(`[SECURITY] SMS_PROVIDER=console in production! OTP NOT displayed.`);
            this.logger.log(`[AUDIT] OTP generated for ${this.maskMobile(mobile)} (console mode — no SMS sent)`);
            return { success: true, message: 'OTP generated (configure SMS_PROVIDER for delivery)' };
        }

        // Dev mode only — safe to show OTP in console
        this.logger.log(`\n╔══════════════════════════════════════╗`);
        this.logger.log(`║  DEV MODE — OTP for ${mobile}: ${otpCode}  ║`);
        this.logger.log(`╚══════════════════════════════════════╝\n`);

        return { success: true, message: 'OTP logged to console (dev mode)' };
    }

    // SECURITY: Mask mobile number in logs — only show last 4 digits
    private maskMobile(mobile: string): string {
        if (mobile.length <= 4) return '****';
        return '****' + mobile.slice(-4);
    }
}
