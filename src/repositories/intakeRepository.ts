import prisma from '../db/prisma';
import { IntakeStatus, IntakeUrgency } from '../types/intake';

const assignedToSelect = {
    id: true,
    email: true,
    name: true,
    role: true,
} as const;

interface CreateIntakeData {
    callerName: string;
    phone: string;
    contactedOtherCenter: string;
    caseDescription: string;
    urgency: IntakeUrgency;
    status: IntakeStatus;
    assignedToId: number | null;
}

export class IntakeRepository {
    async create(data: CreateIntakeData) {
        return prisma.intake.create({
            data,
            include: { assignedTo: { select: assignedToSelect }, callReport: true },
        });
    }

    async findAllWithAssignee() {
        return prisma.intake.findMany({
            include: { assignedTo: { select: assignedToSelect }, callReport: true },
            orderBy: { createdAt: 'desc' },
        });
    }

    async findById(id: number) {
        return prisma.intake.findUnique({
            where: { id },
            include: { assignedTo: { select: assignedToSelect }, callReport: true },
        });
    }

    // Atomic: only succeeds if nobody has claimed the case since the caller checked.
    async claimIfUnassigned(id: number, userId: number) {
        return prisma.intake.updateMany({
            where: { id, assignedToId: null },
            data: { assignedToId: userId, status: 'ACTIVE' },
        });
    }

    // Atomic: only succeeds if the caller is still the current owner.
    async undoClaimIfOwner(id: number, userId: number) {
        return prisma.intake.updateMany({
            where: { id, assignedToId: userId },
            data: { assignedToId: null, status: 'NEW' },
        });
    }

    // Atomic: only succeeds if the case is claimed but not actively locked.
    async takeoverIfReleased(id: number, userId: number) {
        return prisma.intake.updateMany({
            where: { id, assignedToId: { not: null }, NOT: { status: 'ACTIVE' } },
            data: { assignedToId: userId },
        });
    }

    // Atomic: only succeeds if the caller is still the current owner.
    async updateStatusIfOwner(id: number, userId: number, status: IntakeStatus) {
        return prisma.intake.updateMany({
            where: { id, assignedToId: userId },
            data: { status },
        });
    }
}
