import { Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { Admin } from '../entities';

// SECURITY: In-memory login attempt tracker
// Tracks failed attempts per username to prevent brute force
const loginAttempts = new Map<string, { count: number; lastAttempt: number; lockedUntil: number }>();

const MAX_LOGIN_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 15 * 60 * 1000; // 15 minutes
const ATTEMPT_WINDOW_MS = 10 * 60 * 1000;   // 10-minute window

@Injectable()
export class AuthService {
    constructor(
        @InjectRepository(Admin)
        private adminRepo: Repository<Admin>,
        private jwtService: JwtService,
    ) { }

    async login(username: string, password: string) {
        const normalizedUsername = username.trim().toLowerCase();

        // ═══════════════════════════════════════════
        // SECURITY: Check account lockout
        // ═══════════════════════════════════════════
        const attempts = loginAttempts.get(normalizedUsername);
        if (attempts && attempts.lockedUntil > Date.now()) {
            const remainingMins = Math.ceil((attempts.lockedUntil - Date.now()) / 60000);
            throw new UnauthorizedException(
                `Account temporarily locked. Try again in ${remainingMins} minute(s).`
            );
        }

        // Reset old attempts outside window
        if (attempts && Date.now() - attempts.lastAttempt > ATTEMPT_WINDOW_MS) {
            loginAttempts.delete(normalizedUsername);
        }

        const admin = await this.adminRepo.findOne({ where: { username: normalizedUsername } });

        // ═══════════════════════════════════════════
        // SECURITY: Constant-time comparison to prevent
        // timing attacks (don't reveal if user exists)
        // ═══════════════════════════════════════════
        if (!admin) {
            // Hash a dummy password to maintain constant time
            await bcrypt.compare(password, '$2b$10$dummyhashforconstanttime000000000000000000000');
            this.recordFailedAttempt(normalizedUsername);
            throw new UnauthorizedException('Invalid credentials');
        }

        const isMatch = await bcrypt.compare(password, admin.password);
        if (!isMatch) {
            this.recordFailedAttempt(normalizedUsername);
            throw new UnauthorizedException('Invalid credentials');
        }

        // Clear attempts on successful login
        loginAttempts.delete(normalizedUsername);

        console.log(`🔐 [AUDIT] Admin login: ${normalizedUsername} at ${new Date().toISOString()}`);

        const payload = {
            sub: admin.id,
            username: admin.username,
            role: 'ADMIN',
            iat: Math.floor(Date.now() / 1000),
        };

        return {
            access_token: this.jwtService.sign(payload),
            user: { id: admin.id, username: admin.username, role: 'ADMIN' },
        };
    }

    private recordFailedAttempt(username: string) {
        const current = loginAttempts.get(username) || { count: 0, lastAttempt: 0, lockedUntil: 0 };
        current.count++;
        current.lastAttempt = Date.now();

        if (current.count >= MAX_LOGIN_ATTEMPTS) {
            current.lockedUntil = Date.now() + LOCKOUT_DURATION_MS;
            console.log(` [SECURITY] Account locked: ${username} — ${MAX_LOGIN_ATTEMPTS} failed attempts`);
        }

        loginAttempts.set(username, current);
        console.log(`  [SECURITY] Failed login for: ${username} (attempt ${current.count}/${MAX_LOGIN_ATTEMPTS})`);
    }

    async getMe(userId: string) {
        const admin = await this.adminRepo.findOne({ where: { id: userId } });
        if (!admin) throw new UnauthorizedException();
        return { id: admin.id, username: admin.username, role: 'ADMIN' };
    }

    async seedAdmin() {
        const exists = await this.adminRepo.findOne({ where: { username: 'admin' } });
        if (!exists) {
            // SECURITY: bcrypt with cost factor 12 (stronger than default 10)
            const hashed = await bcrypt.hash('admin123', 12);
            await this.adminRepo.save({ username: 'admin', password: hashed });
            console.log('✅ Default admin seeded: admin / admin123');
        }
    }

    async changePassword(adminId: string, currentPassword: string, newPassword: string) {
        const admin = await this.adminRepo.findOne({ where: { id: adminId } });
        if (!admin) throw new UnauthorizedException('Admin not found');

        // Verify current password
        const isMatch = await bcrypt.compare(currentPassword, admin.password);
        if (!isMatch) {
            console.log(`  [SECURITY] Failed password change for admin ID ${adminId} — wrong current password`);
            throw new UnauthorizedException('Current password is incorrect');
        }

        // Hash new password with cost 12
        admin.password = await bcrypt.hash(newPassword, 12);
        await this.adminRepo.save(admin);

        console.log(`🔐 [AUDIT] Password changed for admin: ${admin.username} at ${new Date().toISOString()}`);

        return { message: 'Password changed successfully' };
    }
}
