import { Router } from 'express';
import { validateCallReport } from '../middlewares/validators';
import { createCallReport } from '../controllers/reportController';

export const reportRouter = Router();

// POST /api/reports
reportRouter.post('/reports', validateCallReport, createCallReport);
