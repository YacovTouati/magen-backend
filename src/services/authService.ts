import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { Prisma } from '../generated/prisma/client';
import { HttpError } from '../errors/httpError';
import { UserRepository } from '../repositories/userRepository';
import { InvitedUserRepository } from '../repositories/invitedUserRepository';
import { EmailService } from './emailService';
import { generateToken, hashToken } from '../utils/tokens';
import { LoginPayload, AuthTokenPayload } from '../types/auth';
import { RegisterPayload } from '../types/user';

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '8h';
const RESET_TOKEN_TTL_MS = 15 * 60 * 1000; // 15 minutes

if (!JWT_SECRET) {
    throw new Error('JWT_SECRET is not set in the environment');
}

export class AuthService {
    private userRepository = new UserRepository();
    private invitedUserRepository = new InvitedUserRepository();
    private emailService = new EmailService();

    async login(payload: LoginPayload) {
        const user = await this.userRepository.findByEmail(payload.email);
        if (!user) {
            throw new HttpError(401, 'אימייל או סיסמה שגויים');
        }

        const passwordMatches = await bcrypt.compare(payload.password, user.password);
        if (!passwordMatches) {
            throw new HttpError(401, 'אימייל או סיסמה שגויים');
        }

        return this.issueToken(user.id, user.email, user.role);
    }

    // Requires BOTH the email to be on the whitelist AND the raw token from
    // the invite link to hash-match that whitelist row — checking the email
    // alone would let anyone who merely knows a whitelisted address register
    // on it themselves before the real invitee does.
    async register(payload: RegisterPayload) {
        const invite = await this.invitedUserRepository.findByEmail(payload.email);
        if (!invite || invite.usedAt) {
            throw new HttpError(403, 'כתובת המייל אינה ברשימת המוזמנים למערכת');
        }
        if (invite.expiresAt < new Date()) {
            throw new HttpError(403, 'תוקף ההזמנה פג — יש לבקש הזמנה חדשה מהמנהל');
        }
        if (hashToken(payload.token) !== invite.tokenHash) {
            throw new HttpError(403, 'טוקן ההרשמה אינו תקין');
        }

        const hashedPassword = await bcrypt.hash(payload.password, 10);

        try {
            const user = await this.invitedUserRepository.consumeInviteAndCreateUser(invite.id, {
                email: payload.email,
                password: hashedPassword,
                name: payload.name,
                phone: payload.phone,
                role: invite.role,
            });
            return this.issueToken(user.id, user.email, user.role);
        } catch (error) {
            if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
                // Lost a race against a concurrent registration on the same email.
                throw new HttpError(409, 'כתובת המייל כבר רשומה במערכת');
            }
            throw error;
        }
    }

    // Always resolves the same way regardless of whether the email exists —
    // a different response for "not found" would let this endpoint be used
    // to enumerate which emails are registered.
    async forgotPassword(email: string): Promise<void> {
        const user = await this.userRepository.findByEmail(email);
        if (!user) {
            return;
        }

        const rawToken = generateToken();
        const expiresAt = new Date(Date.now() + RESET_TOKEN_TTL_MS);
        await this.userRepository.setPasswordResetToken(user.id, hashToken(rawToken), expiresAt);
        await this.emailService.sendPasswordResetEmail(user.email, rawToken);
    }

    async resetPassword(rawToken: string, newPassword: string): Promise<void> {
        const user = await this.userRepository.findByResetTokenHash(hashToken(rawToken));
        if (!user || !user.passwordResetExpiresAt || user.passwordResetExpiresAt < new Date()) {
            throw new HttpError(400, 'קישור איפוס הסיסמה אינו תקין או שפג תוקפו');
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);
        await this.userRepository.updatePassword(user.id, hashedPassword);
        // Consumed either way — a reset token is single-use even though this
        // is a separate statement from the password update above.
        await this.userRepository.clearPasswordResetToken(user.id);
    }

    private issueToken(id: number, email: string, role: AuthTokenPayload['role']) {
        const tokenPayload: AuthTokenPayload = { id, email, role };
        const token = jwt.sign(tokenPayload, JWT_SECRET as string, { expiresIn: JWT_EXPIRES_IN } as jwt.SignOptions);
        return { token, user: tokenPayload };
    }
}
