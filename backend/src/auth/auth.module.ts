import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Admin } from '../entities';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtStrategy } from './jwt.strategy';

@Module({
    imports: [
        TypeOrmModule.forFeature([Admin]),
        PassportModule,
        JwtModule.register({
            secret: process.env.JWT_SECRET || 'evoting-secret-key-2024',
            signOptions: { expiresIn: '2h' },
        }),
    ],
    controllers: [AuthController],
    providers: [AuthService, JwtStrategy],
    exports: [AuthService, JwtModule],
})
export class AuthModule { }
