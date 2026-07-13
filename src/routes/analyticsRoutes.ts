import { Router } from 'express';
import { getAnalyticsSummary } from '../controllers/analyticsController';
import { authenticate } from '../middlewares/auth';

export const analyticsRouter = Router();

analyticsRouter.get('/analytics/summary', authenticate, getAnalyticsSummary);
