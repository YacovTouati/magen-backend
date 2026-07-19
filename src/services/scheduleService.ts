import { Prisma } from '../generated/prisma/client';
import { HttpError } from '../errors/httpError';
import { ScheduleRepository } from '../repositories/scheduleRepository';

export class ScheduleService {
    private scheduleRepository = new ScheduleRepository();

    async createSchedule(month: number, year: number) {
        try {
            return await this.scheduleRepository.createWithShifts(month, year);
        } catch (error) {
            if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
                throw new HttpError(409, 'כבר קיים לוח משמרות לחודש ושנה אלו');
            }
            throw error;
        }
    }

    async getScheduleWithShifts(scheduleId: number) {
        const schedule = await this.scheduleRepository.findByIdWithShifts(scheduleId);
        if (!schedule) {
            throw new HttpError(404, 'לוח משמרות לא נמצא');
        }
        return schedule;
    }

    async publish(scheduleId: number) {
        const result = await this.scheduleRepository.publishIfDraft(scheduleId);
        if (result.count === 0) {
            const schedule = await this.scheduleRepository.findById(scheduleId);
            if (!schedule) {
                throw new HttpError(404, 'לוח משמרות לא נמצא');
            }
            throw new HttpError(400, 'לוח המשמרות כבר פורסם');
        }
        return this.scheduleRepository.findById(scheduleId);
    }

    async claimShift(shiftId: number, volunteerId: number) {
        const result = await this.scheduleRepository.claimShiftIfAvailable(shiftId, volunteerId);
        if (result.count === 0) {
            // Race lost, doesn't exist, or the schedule isn't open yet — the atomic
            // update above already decided the outcome; this re-fetch only exists
            // to report *why*, it never changes what actually happened.
            const shift = await this.scheduleRepository.findShiftById(shiftId);
            if (!shift) {
                throw new HttpError(404, 'משמרת לא נמצאה');
            }
            if (shift.schedule.status !== 'OPEN') {
                throw new HttpError(400, 'לוח המשמרות עדיין לא פורסם לשיבוץ');
            }
            throw new HttpError(400, 'המשמרת כבר נתפסה על ידי מתנדב אחר');
        }
        return this.scheduleRepository.findShiftById(shiftId);
    }

    // The only code path that can ever move a shift out of LOCKED. Role
    // enforcement (admin-only) belongs at the route layer, not here — same
    // separation already used for every other admin-gated mutation.
    async adminRelease(shiftId: number) {
        const result = await this.scheduleRepository.releaseShiftIfLocked(shiftId);
        if (result.count === 0) {
            const shift = await this.scheduleRepository.findShiftById(shiftId);
            if (!shift) {
                throw new HttpError(404, 'משמרת לא נמצאה');
            }
            throw new HttpError(400, 'המשמרת אינה נעולה כרגע');
        }
        return this.scheduleRepository.findShiftById(shiftId);
    }
}
