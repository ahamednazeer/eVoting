import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Otp, Voter, Election } from '../entities';
import { OtpController } from './otp.controller';
import { OtpService } from './otp.service';
import { JwtModule } from '@nestjs/jwt';

@Module({
    imports: [
        TypeOrmModule.forFeature([Otp, Voter, Election]),
        JwtModule.register({
            secret: process.env.JWT_SECRET || 'evoting-secret-key-2024',
            signOptions: { expiresIn: '30m' },
        }),
    ],
    controllers: [OtpController],
    providers: [OtpService],
    exports: [OtpService],
})
export class OtpModule { }
