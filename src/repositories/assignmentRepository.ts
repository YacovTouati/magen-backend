import prisma from '../db/prisma';
import { Prisma } from '../generated/prisma/client';

const volunteerSelect = {
    id: true,
    email: true,
    name: true,
    role: true,
} as const;

export class AssignmentRepository {
    async findAll(from?: Date, to?: Date) {
        const dateFilter: Prisma.DateTimeFilter = {};
        if (from) dateFilter.gte = from;
        if (to) dateFilter.lte = to;

        return prisma.shiftAssignment.findMany({
            where: Object.keys(dateFilter).length ? { date: dateFilter } : undefined,
            include: { volunteer: { select: volunteerSelect } },
            orderBy: { date: 'asc' },
        });
    }

    // Upsert: assigning a day that's already taken simply replaces the volunteer on it.
    async upsert(date: Date, volunteerId: number) {
        return prisma.shiftAssignment.upsert({
            where: { date },
            update: { volunteerId },
            create: { date, volunteerId },
            include: { volunteer: { select: volunteerSelect } },
        });
    }

    async deleteByDate(date: Date) {
        return prisma.shiftAssignment.deleteMany({ where: { date } });
    }
}
