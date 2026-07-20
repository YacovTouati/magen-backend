import prisma from '../db/prisma';
import { CreateUserPayload, UserRole } from '../types/user';

export class UserRepository {
    async getAllUsers() {
        return prisma.user.findMany({
            select: {
                id: true,
                email: true,
                name: true,
                role: true,
                createdAt: true,
            },
        });
    }

    async findByEmail(email: string) {
        return prisma.user.findUnique({
            where: { email },
        });
    }

    async createUser(payload: CreateUserPayload) {
        return prisma.user.create({
            data: payload,
            select: {
                id: true,
                email: true,
                name: true,
                role: true,
                createdAt: true,
            },
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
            select: {
                id: true,
                email: true,
                name: true,
                role: true,
                createdAt: true,
            },
        });
    }
}
