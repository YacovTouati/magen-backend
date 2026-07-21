import prisma from '../db/prisma';
import { UserRole } from '../types/user';

interface UpsertInviteData {
    email: string;
    role: UserRole;
    tokenHash: string;
    expiresAt: Date;
    invitedById: number;
}

interface RegisteredUserData {
    email: string;
    password: string;
    name: string;
    phone: string;
    role: UserRole;
}

const registeredUserSelect = {
    id: true,
    email: true,
    name: true,
    phone: true,
    role: true,
    createdAt: true,
} as const;

export class InvitedUserRepository {
    async findByEmail(email: string) {
        return prisma.invitedUser.findUnique({ where: { email } });
    }

    // Re-inviting an email with no prior row, or a still-pending one, both
    // land here — the service layer is the one that refuses to touch an
    // already-used row (that email belongs to a real registered user now).
    async upsertPendingInvite(data: UpsertInviteData) {
        return prisma.invitedUser.upsert({
            where: { email: data.email },
            create: data,
            update: {
                role: data.role,
                tokenHash: data.tokenHash,
                expiresAt: data.expiresAt,
                invitedById: data.invitedById,
                usedAt: null,
            },
        });
    }

    // Atomic: the new User row and marking the invite consumed happen in one
    // transaction — a registration can never leave a User created with its
    // invite still showing as pending, or vice versa.
    async consumeInviteAndCreateUser(inviteId: number, userData: RegisteredUserData) {
        return prisma.$transaction(async (tx) => {
            const user = await tx.user.create({
                data: userData,
                select: registeredUserSelect,
            });
            await tx.invitedUser.update({
                where: { id: inviteId },
                data: { usedAt: new Date() },
            });
            return user;
        });
    }

    async findAllPending() {
        return prisma.invitedUser.findMany({
            where: { usedAt: null },
            select: {
                id: true,
                email: true,
                role: true,
                expiresAt: true,
                createdAt: true,
                invitedBy: { select: { id: true, name: true, email: true } },
            },
            orderBy: { createdAt: 'desc' },
        });
    }
}
