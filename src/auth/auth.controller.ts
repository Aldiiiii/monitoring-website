import { Body, Controller, Get, Post, UseGuards, Redirect } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { CurrentUser } from './decorators/current-user.decorator';
import { AuthGuard } from '@nestjs/passport';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Throttle({ auth: { limit: 5, ttl: 60000 } })
  @Post('register')
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Throttle({ auth: { limit: 5, ttl: 60000 } })
  @Post('login')
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  me(@CurrentUser() user: { id: string; email: string; role: string } | null) {
    return user;
  }

  // Google OAuth
  @Get('google')
  @UseGuards(AuthGuard('google'))
  googleLogin() {
    // This initiates the Google OAuth flow
    // User will be redirected to Google
  }

  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  @Redirect()
  async googleLoginCallback(
    @CurrentUser() user: { accessToken: string; expiresIn: number } | null,
  ) {
    if (!user?.accessToken) {
      // Redirect to login page with error
      return { url: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/login?error=auth_failed` };
    }

    // Redirect to frontend with token
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    return { url: `${frontendUrl}/auth/callback?token=${user.accessToken}` };
  }
}
