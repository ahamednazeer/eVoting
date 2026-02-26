import { Controller, Post, Body, Get, UseGuards, Request } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import { JwtAuthGuard, AdminGuard } from './jwt-auth.guard';
import { LoginDto } from '../dto';
import { IsString, IsNotEmpty, MinLength } from 'class-validator';

// DTO for password change
class ChangePasswordDto {
    @IsString()
    @IsNotEmpty()
    current_password: string;

    @IsString()
    @IsNotEmpty()
    @MinLength(6, { message: 'New password must be at least 6 characters' })
    new_password: string;
}

@Controller('api/auth')
export class AuthController {
    constructor(private authService: AuthService) { }

    // SECURITY: Strict rate limit on login — 5 attempts per 60 seconds
    @Throttle({ default: { limit: 5, ttl: 60000 } })
    @Post('login')
    async login(@Body() loginDto: LoginDto) {
        return this.authService.login(loginDto.username, loginDto.password);
    }

    @UseGuards(AdminGuard)
    @Get('me')
    async getMe(@Request() req: any) {
        return this.authService.getMe(req.user.sub);
    }

    // SECURITY: Password change — admin only, requires current password
    @UseGuards(AdminGuard)
    @Post('change-password')
    async changePassword(@Request() req: any, @Body() body: ChangePasswordDto) {
        return this.authService.changePassword(req.user.sub, body.current_password, body.new_password);
    }
}
