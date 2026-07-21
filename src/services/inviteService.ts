import { HttpError } from '../errors/httpError';
import { InvitedUserRepository } from '../repositories/invitedUserRepository';
import { UserRepository } from '../repositories/userRepository';
import { EmailService } from './emailService';
import { generateToken, hashToken } from '../utils/tokens';
import { UserRole } from '../types/user';

const INVITE_TTL_MS = 48 * 60 * 60 * 1000; // 48 hours

export class InviteService {
    private invitedUserRepository = new InvitedUserRepository();
    private userRepository = new UserRepository();
    private emailService = new EmailService();

    async inviteUser(email: string, role: UserRole, invitedById: number) {
        const existingUser = await this.userRepository.findByEmail(email);
        if (existingUser) {
            throw new HttpError(409, 'כתובת המייל כבר רשומה במערכת כמשתמש פעיל');
        }

        const rawToken = generateToken();
        const expiresAt = new Date(Date.now() + INVITE_TTL_MS);

        await this.invitedUserRepository.upsertPendingInvite({
            email,
            role,
            tokenHash: hashToken(rawToken),
            expiresAt,
            invitedById,
        });

        await this.emailService.sendInviteEmail(email, rawToken);

        // No real email provider is wired up yet (see emailService.ts) — the
        // raw token/link is returned here so the inviting admin can relay it
        // manually in the meantime. Safe to return to THIS caller specifically:
        // unlike forgot-password, only an already-authenticated SUPER_ADMIN who
        // chose this exact invitee can ever reach this response.
        return {
            email,
            role,
            expiresAt,
            registrationToken: rawToken,
        };
    }

    async listPendingInvites() {
        return this.invitedUserRepository.findAllPending();
    }
}
