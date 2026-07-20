import { Router } from 'express';
import {
    createIntake,
    deleteIntake,
    extendIntakeExpiration,
    getIntakes,
    updateIntakeStatus,
} from '../controllers/intakeController';
import { authenticate, checkRole } from '../middlewares/auth';
import { validateCreateIntake, validateUpdateIntakeStatus } from '../middlewares/validators';

export const intakeRouter = Router();

intakeRouter.use('/intakes', authenticate);

// List access restricted the same as every other intake mutation — a
// VOLUNTEER has no route left in this file that touches intakes at all.
intakeRouter.get('/intakes', checkRole('SUPER_ADMIN', 'INTAKE_ADMIN'), getIntakes);
intakeRouter.post('/intakes', checkRole('SUPER_ADMIN', 'INTAKE_ADMIN'), validateCreateIntake, createIntake);

// Case ownership no longer exists (removed along with assignedToId) — status
// updates are now gated purely by role, not by "are you the assigned owner."
intakeRouter.patch(
    '/intakes/:id/status',
    checkRole('SUPER_ADMIN', 'INTAKE_ADMIN'),
    validateUpdateIntakeStatus,
    updateIntakeStatus
);

// Pushes expiresAt 7 days past its current value.
intakeRouter.patch(
    '/intakes/:id/extend',
    checkRole('SUPER_ADMIN', 'INTAKE_ADMIN'),
    extendIntakeExpiration
);

// Immediate hard delete, separate from the automatic 14-day retention sweep
// (see src/jobs/intakeRetentionJob.ts) — backs the frontend's "close and
// delete now" confirmation dialog for terminal statuses.
intakeRouter.delete('/intakes/:id', checkRole('SUPER_ADMIN', 'INTAKE_ADMIN'), deleteIntake);
