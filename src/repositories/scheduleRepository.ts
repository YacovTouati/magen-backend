import prisma from '../db/prisma';
import { ShiftType } from '../types/schedule';

const volunteerSelect = {
    id: true,
    email: true,
    name: true,
    role: true,
} as const;

export class ScheduleRepository {
    // Schedule + every one of its Shift rows are created in a single transaction —
    // a schedule must never exist with only some of its days materialized.
    async createWithShifts(month: number, year: number) {
        return prisma.$transaction(async (tx) => {
            const schedule = await tx.schedule.create({ data: { month, year } });

            const daysInMonth = new Date(year, month, 0).getDate();
            const shiftRows: { scheduleId: number; date: Date; type: ShiftType }[] = [];

            for (let day = 1; day <= daysInMonth; day++) {
                // UTC midnight, not local time — avoids a day drifting across the
                // date boundary depending on server timezone (same convention
                // assignmentService already uses for calendar dates).
                const date = new Date(Date.UTC(year, month - 1, day));
                shiftRows.push({ scheduleId: schedule.id, date, type: 'MORNING' });
                shiftRows.push({ scheduleId: schedule.id, date, type: 'EVENING' });
            }

            const { count } = await tx.shift.createMany({ data: shiftRows });

            return { schedule, shiftsCreated: count };
        });
    }

    async findById(id: number) {
        return prisma.schedule.findUnique({ where: { id } });
    }

    async findByIdWithShifts(id: number) {
        return prisma.schedule.findUnique({
            where: { id },
            include: {
                shifts: {
                    include: { volunteer: { select: volunteerSelect } },
                    orderBy: [{ date: 'asc' }, { type: 'asc' }],
                },
            },
        });
    }

    async findShiftById(id: number) {
        return prisma.shift.findUnique({
            where: { id },
            include: {
                volunteer: { select: volunteerSelect },
                schedule: { select: { id: true, status: true, month: true, year: true } },
            },
        });
    }

    // Atomic: only succeeds if the schedule hasn't already been published.
    async publishIfDraft(scheduleId: number) {
        return prisma.schedule.updateMany({
            where: { id: scheduleId, status: 'DRAFT' },
            data: { status: 'OPEN' },
        });
    }

    // Atomic: the single statement that makes double-booking structurally impossible.
    // Both guards — the shift must be open, and its parent schedule must be open —
    // live in the same WHERE clause, so there's no gap between checking the
    // schedule and locking the shift for a schedule to get closed out from under it.
    async claimShiftIfAvailable(shiftId: number, volunteerId: number) {
        return prisma.shift.updateMany({
            where: {
                id: shiftId,
                status: 'OPEN',
                schedule: { status: 'OPEN' },
            },
            data: {
                status: 'LOCKED',
                volunteerId,
                lockedAt: new Date(),
            },
        });
    }

    // Atomic: admin-only escape hatch. Only succeeds if the shift is currently
    // locked — releasing an already-open shift is a no-op the service reports
    // clearly rather than silently succeeding.
    async releaseShiftIfLocked(shiftId: number) {
        return prisma.shift.updateMany({
            where: { id: shiftId, status: 'LOCKED' },
            data: { status: 'OPEN', volunteerId: null, lockedAt: null },
        });
    }
}
