import { Router } from 'express';
import {
    claimIntake,
    getIntakes,
    takeoverIntake,
    undoClaimIntake,
    updateIntakeStatus,
} from '../controllers/intakeController';
import { authenticate } from '../middlewares/auth';
import { validateUpdateIntakeStatus } from '../middlewares/validators';

export const intakeRouter = Router();

intakeRouter.use('/intakes', authenticate);

intakeRouter.get('/intakes', getIntakes);
intakeRouter.post('/intakes/:id/claim', claimIntake);
intakeRouter.post('/intakes/:id/undo-claim', undoClaimIntake);
intakeRouter.post('/intakes/:id/takeover', takeoverIntake);
intakeRouter.patch('/intakes/:id/status', validateUpdateIntakeStatus, updateIntakeStatus);
