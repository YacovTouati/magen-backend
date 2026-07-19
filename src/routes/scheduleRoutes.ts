import { Router } from 'express';
import {
    adminReleaseShift,
    claimShift,
    createSchedule,
    getScheduleShifts,
    publishSchedule,
} from '../controllers/scheduleController';
import { authenticate, checkRole } from '../middlewares/auth';
import { validateCreateSchedule } from '../middlewares/validators';

export const scheduleRouter = Router();

scheduleRouter.use('/schedules', authenticate);
scheduleRouter.use('/shifts', authenticate);

// Admin: prepare + publish a month's schedule
scheduleRouter.post('/schedules', checkRole('ADMIN'), validateCreateSchedule, createSchedule);
scheduleRouter.post('/schedules/:id/publish', checkRole('ADMIN'), publishSchedule);

// Any authenticated user (volunteer needs to see what's claimable) — read-only,
// no role gate. Same open-read posture as GET /api/intakes and GET /api/assignments.
scheduleRouter.get('/schedules/:id/shifts', getScheduleShifts);

// Any authenticated volunteer: claim an open shift. No unassign/edit route exists
// for this surface at all — locked shifts are only ever released by an admin.
scheduleRouter.post('/shifts/:id/claim', claimShift);

// Admin-only escape hatch — the single path that can move a shift out of LOCKED.
scheduleRouter.post('/shifts/:id/admin-release', checkRole('ADMIN'), adminReleaseShift);
