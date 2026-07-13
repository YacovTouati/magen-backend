import { Router } from 'express';
import { validateCallReport } from '../middlewares/validators';
import { createCallReport } from '../controllers/reportController';
import { authenticate } from '../middlewares/auth';
import { reportSubmissionLimiter } from '../middlewares/rateLimiters';

export const reportRouter = Router();

// POST /api/reports
reportRouter.post('/reports', authenticate, reportSubmissionLimiter, validateCallReport, createCallReport);
