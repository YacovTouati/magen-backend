import { Router } from 'express';
import {
    deleteAssignment,
    getAssignments,
    upsertAssignment,
} from '../controllers/assignmentController';
import { authenticate, checkRole } from '../middlewares/auth';
import { validateUpsertAssignment } from '../middlewares/validators';

export const assignmentRouter = Router();

assignmentRouter.use('/assignments', authenticate);

assignmentRouter.get('/assignments', getAssignments);
assignmentRouter.post('/assignments', checkRole('ADMIN'), validateUpsertAssignment, upsertAssignment);
assignmentRouter.delete('/assignments/:date', checkRole('ADMIN'), deleteAssignment);
