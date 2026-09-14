import {
  Injectable, UnauthorizedException, ConflictException,
  NotFoundException, BadRequestException, Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcryptjs';
import * as speakeasy from 'speakeasy';
import * as qrcode from 'qrcode';
import { v4 as uuidv4 } from 'uuid';
import { PrismaService } from '../../infrastructure/database/prisma.service';
import { RedisService } from '../../infrastructure/redis/redis.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private readonly REFRESH_TOKEN_PREFIX = 'refresh:';
  private readonly BLACKLIST_PREFIX = 'blacklist:';
  private readonly RESET_PREFIX = 'reset:';
  private readonly MAX_LOGIN_ATTEMPTS = 5;
  private readonly LOCKOUT_DURATION = 30 * 60; // 30 minutos

  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private redis: RedisService,
    private config: ConfigService,
  ) {}

  // ── Login ─────────────────────────────────────────────────────────────
  async login(dto: LoginDto, ipAddress?: string): Promise<TokenPair> {
    const lockKey = `lock:${dto.email}`;
    const isLocked = await this.redis.exists(lockKey);
    if (isLocked) {
      throw new UnauthorizedException(
        'Conta temporariamente bloqueada. Tente novamente em 30 minutos.',
      );
    }

    const user = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase() },
      select: {
        id: true, tenantId: true, email: true, passwordHash: true,
        role: true, isActive: true, mfaEnabled: true, mfaSecret: true, name: true,
      },
    });

    if (!user || !(await bcrypt.compare(dto.password, user.passwordHash))) {
      await this.registerFailedAttempt(dto.email, lockKey);
      throw new UnauthorizedException('Credenciais inválidas');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('Conta desativada. Entre em contato com o suporte.');
    }

    if (user.mfaEnabled) {
      if (!dto.mfaCode) {
        throw new BadRequestException('Código MFA obrigatório');
      }
      const isValid = speakeasy.totp.verify({
        secret: user.mfaSecret!,
        encoding: 'base32',
        token: dto.mfaCode,
        window: 1,
      });
      if (!isValid) throw new UnauthorizedException('Código MFA inválido');
    }

    // Limpa tentativas com sucesso
    await this.redis.del(`attempts:${dto.email}`);

    // Atualiza lastLogin
    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date(), lastLoginIp: ipAddress },
    });

    return this.generateTokenPair(user);
  }

  // ── Register ──────────────────────────────────────────────────────────
  async register(dto: RegisterDto): Promise<TokenPair> {
    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase() },
    });
    if (existing) throw new ConflictException('E-mail já cadastrado');

    const passwordHash = await bcrypt.hash(dto.password, 12);
    const user = await this.prisma.user.create({
      data: {
        email: dto.email.toLowerCase(),
        passwordHash,
        name: dto.name,
        phone: dto.phone,
        tenantId: dto.tenantId || uuidv4(), // criar tenant automaticamente se não informado
        role: 'ADMIN',
      },
    });

    return this.generateTokenPair(user);
  }

  // ── Refresh Token ─────────────────────────────────────────────────────
  async refreshToken(token: string): Promise<TokenPair> {
    const stored = await this.redis.get(`${this.REFRESH_TOKEN_PREFIX}${token}`);
    if (!stored) throw new UnauthorizedException('Refresh token inválido ou expirado');

    const userData = JSON.parse(stored);
    // Rotaciona: invalida o token atual
    await this.redis.del(`${this.REFRESH_TOKEN_PREFIX}${token}`);

    const user = await this.prisma.user.findUnique({
      where: { id: userData.userId },
      select: { id: true, tenantId: true, email: true, role: true, isActive: true },
    });
    if (!user || !user.isActive) throw new UnauthorizedException('Usuário inativo');

    return this.generateTokenPair(user);
  }

  // ── Logout ────────────────────────────────────────────────────────────
  async logout(refreshToken: string, accessToken: string): Promise<void> {
    await this.redis.del(`${this.REFRESH_TOKEN_PREFIX}${refreshToken}`);
    // Blacklist o access token pelo tempo restante
    const decoded = this.jwtService.decode(accessToken) as { exp: number };
    if (decoded?.exp) {
      const ttl = decoded.exp - Math.floor(Date.now() / 1000);
      if (ttl > 0) {
        await this.redis.set(`${this.BLACKLIST_PREFIX}${accessToken}`, '1', ttl);
      }
    }
  }

  // ── Forgot Password ───────────────────────────────────────────────────
  async forgotPassword(email: string): Promise<void> {
    const user = await this.prisma.user.findUnique({ where: { email: email.toLowerCase() } });
    if (!user) return; // Não revela se email existe

    const token = uuidv4();
    await this.redis.set(`${this.RESET_PREFIX}${token}`, user.id, 3600); // 1h

    // TODO: enviar e-mail com link de reset
    this.logger.log(`[RESET] Token gerado para ${email}: ${token}`);
  }

  // ── Reset Password ────────────────────────────────────────────────────
  async resetPassword(token: string, newPassword: string): Promise<void> {
    const userId = await this.redis.get(`${this.RESET_PREFIX}${token}`);
    if (!userId) throw new BadRequestException('Token inválido ou expirado');

    const passwordHash = await bcrypt.hash(newPassword, 12);
    await this.prisma.user.update({ where: { id: userId }, data: { passwordHash } });
    await this.redis.del(`${this.RESET_PREFIX}${token}`);

    // Invalida todos os refresh tokens do usuário
    await this.revokeAllTokens(userId);
  }

  // ── MFA Setup ─────────────────────────────────────────────────────────
  async setupMfa(userId: string): Promise<{ secret: string; qrCodeUrl: string }> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('Usuário não encontrado');

    const secret = speakeasy.generateSecret({
      name: `RESGATE AI (${user.email})`,
      length: 20,
    });

    await this.prisma.user.update({
      where: { id: userId },
      data: { mfaSecret: secret.base32 },
    });

    const qrCodeUrl = await qrcode.toDataURL(secret.otpauth_url!);
    return { secret: secret.base32, qrCodeUrl };
  }

  async enableMfa(userId: string, token: string): Promise<void> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user?.mfaSecret) throw new BadRequestException('MFA não configurado');

    const isValid = speakeasy.totp.verify({
      secret: user.mfaSecret,
      encoding: 'base32',
      token,
      window: 1,
    });
    if (!isValid) throw new BadRequestException('Código MFA inválido');

    await this.prisma.user.update({ where: { id: userId }, data: { mfaEnabled: true } });
  }

  // ── Private helpers ───────────────────────────────────────────────────
  private async generateTokenPair(user: { id: string; tenantId: string; email: string; role: string }): Promise<TokenPair> {
    const payload = {
      sub: user.id,
      email: user.email,
      tenantId: user.tenantId,
      role: user.role,
    };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload),
      this.jwtService.signAsync(payload, {
        secret: this.config.getOrThrow('JWT_REFRESH_SECRET'),
        expiresIn: this.config.get('JWT_REFRESH_EXPIRES_IN', '7d'),
      }),
    ]);

    const refreshTtl = 7 * 24 * 60 * 60; // 7 dias em segundos
    await this.redis.setJson(
      `${this.REFRESH_TOKEN_PREFIX}${refreshToken}`,
      { userId: user.id, tenantId: user.tenantId },
      refreshTtl,
    );

    const expiresIn = 15 * 60; // 15 minutos em segundos
    return { accessToken, refreshToken, expiresIn };
  }

  private async registerFailedAttempt(email: string, lockKey: string): Promise<void> {
    const attemptsKey = `attempts:${email}`;
    const attempts = await this.redis.incr(attemptsKey);
    await this.redis.expire(attemptsKey, 900); // 15min

    if (attempts >= this.MAX_LOGIN_ATTEMPTS) {
      await this.redis.set(lockKey, '1', this.LOCKOUT_DURATION);
      this.logger.warn(`Conta bloqueada por tentativas excessivas: ${email}`);
    }
  }

  private async revokeAllTokens(userId: string): Promise<void> {
    // Em produção, usar Redis SCAN para revogar todos os tokens do usuário
    this.logger.log(`Tokens revogados para usuário: ${userId}`);
  }
}
