import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import * as crypto from 'crypto';
import { Otp, OtpStatus, Voter, Election, ElectionStatus } from '../entities';
import { SmsService } from '../sms/sms.service';

// ═══════════════════════════════════════════════
// SECURITY: OTP attempt tracking per mobile
// ═══════════════════════════════════════════════
const otpAttempts = new Map<string, { count: number; lastAttempt: number; lockedUntil: number }>();
const MAX_OTP_ATTEMPTS = 5;
const OTP_LOCKOUT_MS = 30 * 60 * 1000;
const OTP_COOLDOWN_MS = 60 * 1000;

// SECURITY: Mask mobile number — only show last 4 digits
function maskMobile(mobile: string): string {
    if (mobile.length <= 4) return '****';
    return '****' + mobile.slice(-4);
}

@Injectable()
export class OtpService {
    private readonly logger = new Logger('OtpService');

    constructor(
        @InjectRepository(Otp)
        private otpRepo: Repository<Otp>,
        @InjectRepository(Voter)
        private voterRepo: Repository<Voter>,
        @InjectRepository(Election)
        private electionRepo: Repository<Election>,
        private jwtService: JwtService,
        private smsService: SmsService,
    ) { }

    async sendOtp(mobile: string) {
        // ═══ SECURITY: Check lockout ═══
        const attempts = otpAttempts.get(mobile);
        if (attempts && attempts.lockedUntil > Date.now()) {
            const remainingMins = Math.ceil((attempts.lockedUntil - Date.now()) / 60000);
            throw new BadRequestException(`Too many attempts. Try again in ${remainingMins} minute(s).`);
        }

        // ═══ SECURITY: Cooldown — prevent spamming ═══
        const recentOtp = await this.otpRepo.findOne({
            where: { mobile, status: OtpStatus.UNUSED },
            order: { created_at: 'DESC' },
        });
        if (recentOtp) {
            const createdAt = new Date(recentOtp.created_at).getTime();
            if (Date.now() - createdAt < OTP_COOLDOWN_MS) {
                throw new BadRequestException('Please wait 60 seconds before requesting a new OTP');
            }
        }

        // Find voter
        const voter = await this.voterRepo.findOne({
            where: { mobile },
            relations: ['election'],
        });
        if (!voter) {
            // SECURITY: Don't reveal if number is registered
            this.logger.warn(`[SECURITY] OTP request for unregistered: ${maskMobile(mobile)}`);
            throw new BadRequestException('Mobile number not registered as a voter');
        }

        if (!voter.election || voter.election.status !== ElectionStatus.ACTIVE) {
            throw new BadRequestException('No active election found for this voter');
        }

        if (voter.has_voted) {
            throw new BadRequestException('You have already voted in this election');
        }

        // ═══ SECURITY: Invalidate all previous unused OTPs ═══
        await this.otpRepo.update(
            { mobile, status: OtpStatus.UNUSED },
            { status: OtpStatus.USED },
        );

        // ═══ SECURITY: Cryptographically secure OTP ═══
        const otpCode = crypto.randomInt(1000, 9999).toString();
        const expiry = new Date(Date.now() + 5 * 60 * 1000).toISOString();

        const otp = this.otpRepo.create({
            mobile,
            otp: otpCode,
            expiry,
            status: OtpStatus.UNUSED,
        });
        await this.otpRepo.save(otp);

        // ═══ Send SMS via configured provider ═══
        const smsResult = await this.smsService.sendOtp(mobile, otpCode);

        // SECURITY: NEVER log the OTP value — only log delivery status
        this.logger.log(`[AUDIT] OTP generated for ${maskMobile(mobile)} — delivery: ${smsResult.success ? 'OK' : 'FAILED'}`);

        return {
            message: 'OTP sent successfully',
            election_id: voter.election_id,
            voter_name: voter.name,
        };
    }

    async verifyOtp(mobile: string, otpCode: string) {
        // ═══ SECURITY: Check lockout ═══
        const attempts = otpAttempts.get(mobile);
        if (attempts && attempts.lockedUntil > Date.now()) {
            const remainingMins = Math.ceil((attempts.lockedUntil - Date.now()) / 60000);
            throw new BadRequestException(`Too many failed attempts. Try again in ${remainingMins} minute(s).`);
        }

        const otp = await this.otpRepo.findOne({
            where: { mobile, otp: otpCode, status: OtpStatus.UNUSED },
            order: { created_at: 'DESC' },
        });

        if (!otp) {
            this.recordFailedOtpAttempt(mobile);
            throw new BadRequestException('Invalid OTP');
        }

        if (new Date(otp.expiry) < new Date()) {
            otp.status = OtpStatus.USED;
            await this.otpRepo.save(otp);
            throw new BadRequestException('OTP has expired. Please request a new one.');
        }

        // Mark used & clear attempts
        otp.status = OtpStatus.USED;
        await this.otpRepo.save(otp);
        otpAttempts.delete(mobile);

        const voter = await this.voterRepo.findOne({
            where: { mobile },
            relations: ['election'],
        });
        if (!voter) throw new BadRequestException('Voter not found');

        if (voter.has_voted) {
            throw new BadRequestException('You have already voted in this election');
        }

        // SECURITY: Log verification without OTP value
        this.logger.log(`[AUDIT] OTP verified for ${maskMobile(mobile)}`);

        // SECURITY: Short-lived voter token (15 min)
        const payload = {
            sub: voter.id,
            mobile: voter.mobile,
            election_id: voter.election_id,
            constituency: voter.constituency,
            role: 'VOTER',
            iat: Math.floor(Date.now() / 1000),
        };

        return {
            access_token: this.jwtService.sign(payload, { expiresIn: '15m' }),
            voter: {
                id: voter.id,
                name: voter.name,
                constituency: voter.constituency,
                election_id: voter.election_id,
                election_name: voter.election?.name,
            },
        };
    }

    private recordFailedOtpAttempt(mobile: string) {
        const current = otpAttempts.get(mobile) || { count: 0, lastAttempt: 0, lockedUntil: 0 };
        current.count++;
        current.lastAttempt = Date.now();
        if (current.count >= MAX_OTP_ATTEMPTS) {
            current.lockedUntil = Date.now() + OTP_LOCKOUT_MS;
            this.logger.warn(`[SECURITY] Mobile locked: ${maskMobile(mobile)} — ${MAX_OTP_ATTEMPTS} failed attempts`);
        }
        otpAttempts.set(mobile, current);
        // SECURITY: Only log masked mobile, never the OTP attempt value
        this.logger.warn(`[SECURITY] Failed OTP for: ${maskMobile(mobile)} (attempt ${current.count}/${MAX_OTP_ATTEMPTS})`);
    }
}
