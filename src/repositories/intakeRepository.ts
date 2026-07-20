import prisma from '../db/prisma';
import { IntakeStatus, IntakeUrgency } from '../types/intake';

interface CreateIntakeData {
    callerName: string;
    phone: string;
    contactedOtherCenter: string;
    caseDescription: string;
    urgency: IntakeUrgency;
    status: IntakeStatus;
}

export class IntakeRepository {
    async create(data: CreateIntakeData) {
        return prisma.intake.create({
            data,
            include: { callReport: true },
        });
    }

    async findAll() {
        return prisma.intake.findMany({
            include: { callReport: true },
            orderBy: { createdAt: 'desc' },
        });
    }

    async findById(id: number) {
        return prisma.intake.findUnique({
            where: { id },
            include: { callReport: true },
        });
    }

    // No ownership guard needed anymore — any SUPER_ADMIN/INTAKE_ADMIN may
    // update any intake's status, enforced at the route layer, not here.
    async updateStatus(id: number, status: IntakeStatus) {
        return prisma.intake.update({
            where: { id },
            data: { status },
            include: { callReport: true },
        });
    }

    // Atomic: extends the row's *current* expiresAt by `days`, computed in
    // SQL rather than read-then-write, so two concurrent extend calls both
    // land instead of one clobbering the other.
    async extendExpiration(id: number, days: number) {
        return prisma.$executeRaw`
            UPDATE "Intake"
            SET "expiresAt" = "expiresAt" + make_interval(days => ${days})
            WHERE id = ${id}
        `;
    }

    async hardDelete(id: number) {
        return prisma.intake.delete({ where: { id } });
    }

    // Permanent retention sweep — called by the cron job in src/jobs/.
    async deleteExpired() {
        return prisma.intake.deleteMany({
            where: { expiresAt: { lte: new Date() } },
        });
    }
}
