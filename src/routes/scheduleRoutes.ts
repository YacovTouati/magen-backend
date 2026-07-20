import { Router } from 'express';
import {
    adminAssignShift,
    adminReleaseShift,
    claimShift,
    createSchedule,
    getScheduleByMonthYear,
    getScheduleShifts,
    publishSchedule,
} from '../controllers/scheduleController';
import { authenticate, checkRole } from '../middlewares/auth';
import {
    validateAdminAssignShift,
    validateCreateSchedule,
    validateScheduleLookup,
} from '../middlewares/validators';

export const scheduleRouter = Router();

scheduleRouter.use('/schedules', authenticate);
scheduleRouter.use('/shifts', authenticate);

// Admin: prepare + publish a month's schedule
scheduleRouter.post('/schedules', checkRole('SUPER_ADMIN', 'SCHEDULER_ADMIN'), validateCreateSchedule, createSchedule);
scheduleRouter.post('/schedules/:id/publish', checkRole('SUPER_ADMIN', 'SCHEDULER_ADMIN'), publishSchedule);

// Any authenticated user (volunteer needs to see what's claimable) — read-only,
// no role gate. Same open-read posture as GET /api/intakes and GET /api/assignments.
scheduleRouter.get('/schedules', validateScheduleLookup, getScheduleByMonthYear);
scheduleRouter.get('/schedules/:id/shifts', getScheduleShifts);

// Any authenticated volunteer: claim an open shift. No unassign/edit route exists
// for this surface at all — locked shifts are only ever released by an admin.
scheduleRouter.post('/shifts/:id/claim', claimShift);

// Admin-only escape hatch — the single path that can move a shift out of LOCKED.
scheduleRouter.post('/shifts/:id/admin-release', checkRole('SUPER_ADMIN', 'SCHEDULER_ADMIN'), adminReleaseShift);

// Admin-only escape hatch — assigns/overwrites a shift directly, bypassing the
// OPEN-only guard that claimShiftIfAvailable enforces for volunteers.
scheduleRouter.post(
    '/shifts/:id/admin-assign',
    checkRole('SUPER_ADMIN', 'SCHEDULER_ADMIN'),
    validateAdminAssignShift,
    adminAssignShift
);
