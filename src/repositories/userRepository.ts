import prisma from '../db/prisma';
import { CreateRegisteredUserPayload, UserRole } from '../types/user';

const publicUserSelect = {
    id: true,
    email: true,
    name: true,
    phone: true,
    role: true,
    receiveIntakeAlerts: true,
    createdAt: true,
} as const;

export class UserRepository {
    async getAllUsers() {
        return prisma.user.findMany({ select: publicUserSelect });
    }

    async findByEmail(email: string) {
        return prisma.user.findUnique({ where: { email } });
    }

    async findById(id: number) {
        return prisma.user.findUnique({ where: { id } });
    }

    // Same row as findById, minus the password hash — for responses that echo
    // the user back to the client (findById itself stays "full row" since its
    // other callers need the hash, e.g. changePassword's bcrypt.compare).
    async findByIdPublic(id: number) {
        return prisma.user.findUnique({ where: { id }, select: publicUserSelect });
    }

    // Only reached by registration, once the invite token has already been
    // verified — never called with an admin-supplied password.
    async createRegisteredUser(payload: CreateRegisteredUserPayload) {
        return prisma.user.create({
            data: payload,
            select: publicUserSelect,
        });
    }

    async deleteUser(id: number) {
        return prisma.user.delete({
            where: { id },
        });
    }

    async updateRole(id: number, role: UserRole) {
        return prisma.user.update({
            where: { id },
            data: { role },
            select: publicUserSelect,
        });
    }

    // Partial update — only the fields present in `data` are touched. Email
    // uniqueness is checked by the service before this runs; P2002 here (email
    // race) and P2025 (no such user) are both left to bubble up to the service.
    async updateDetails(id: number, data: Partial<{ name: string; email: string; role: UserRole }>) {
        return prisma.user.update({
            where: { id },
            data,
            select: publicUserSelect,
        });
    }

    // Atomic: the role guard lives in the WHERE clause itself, not a separate
    // check-then-write — the field is only ever meaningful for SUPER_ADMIN (see
    // schema.prisma), so a row that doesn't match that role affects 0 rows rather
    // than silently succeeding. The service distinguishes "no such user" from
    // "user exists but isn't SUPER_ADMIN" with a follow-up lookup on count === 0.
    async updateIntakeAlertsIfSuperAdmin(id: number, receiveIntakeAlerts: boolean) {
        return prisma.user.updateMany({
            where: { id, role: 'SUPER_ADMIN' },
            data: { receiveIntakeAlerts },
        });
    }

    // Recipients for the new-intake notifier (see intakeAlertService.ts) — only
    // ever SUPER_ADMIN rows, matching the same restriction the update above enforces.
    async findSuperAdminsWithIntakeAlerts() {
        return prisma.user.findMany({
            where: { role: 'SUPER_ADMIN', receiveIntakeAlerts: true },
            select: { email: true },
        });
    }

    async updatePassword(id: number, hashedPassword: string) {
        return prisma.user.update({
            where: { id },
            data: { password: hashedPassword },
        });
    }

    async setPasswordResetToken(id: number, tokenHash: string, expiresAt: Date) {
        return prisma.user.update({
            where: { id },
            data: { passwordResetTokenHash: tokenHash, passwordResetExpiresAt: expiresAt },
        });
    }

    async findByResetTokenHash(tokenHash: string) {
        return prisma.user.findFirst({
            where: { passwordResetTokenHash: tokenHash },
        });
    }

    // Clears the token fields regardless of outcome — called both after a
    // successful reset (consume it) and is safe to reuse for any future
    // "cancel my pending reset" action.
    async clearPasswordResetToken(id: number) {
        return prisma.user.update({
            where: { id },
            data: { passwordResetTokenHash: null, passwordResetExpiresAt: null },
        });
    }
}
