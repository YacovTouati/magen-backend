import { Router } from 'express';
import {
    claimIntake,
    createIntake,
    getIntakes,
    takeoverIntake,
    undoClaimIntake,
    updateIntakeStatus,
} from '../controllers/intakeController';
import { authenticate, checkRole } from '../middlewares/auth';
import { validateCreateIntake, validateUpdateIntakeStatus } from '../middlewares/validators';

export const intakeRouter = Router();

intakeRouter.use('/intakes', authenticate);

intakeRouter.get('/intakes', getIntakes);
intakeRouter.post('/intakes', checkRole('ADMIN'), validateCreateIntake, createIntake);
intakeRouter.post('/intakes/:id/claim', claimIntake);
intakeRouter.post('/intakes/:id/undo-claim', undoClaimIntake);
intakeRouter.post('/intakes/:id/takeover', takeoverIntake);
intakeRouter.patch('/intakes/:id/status', validateUpdateIntakeStatus, updateIntakeStatus);
