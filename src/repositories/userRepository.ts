import prisma from '../db/prisma';
import { CreateRegisteredUserPayload, UserRole } from '../types/user';

const publicUserSelect = {
    id: true,
    email: true,
    name: true,
    phone: true,
    role: true,
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
