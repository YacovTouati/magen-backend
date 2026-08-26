import { Router } from 'express';
import { exportMonthlyIntakes, getAnalyticsSummary, getMonthlyAnalytics } from '../controllers/analyticsController';
import { authenticate, checkRole } from '../middlewares/auth';
import { validateMonthlyAnalyticsLookup } from '../middlewares/validators';

export const analyticsRouter = Router();

analyticsRouter.get('/analytics/summary', authenticate, getAnalyticsSummary);

// Both intake-analytics endpoints below expose per-caller-name/phone/reportedBy
// case-level detail, so they're restricted to admin roles that already manage
// intakes (matches GET /api/intakes's own gate, plus SCHEDULER_ADMIN for reporting).
analyticsRouter.get(
    '/analytics/monthly',
    authenticate,
    checkRole('SUPER_ADMIN', 'SCHEDULER_ADMIN', 'INTAKE_ADMIN'),
    validateMonthlyAnalyticsLookup,
    getMonthlyAnalytics
);
analyticsRouter.get(
    '/analytics/export',
    authenticate,
    checkRole('SUPER_ADMIN', 'SCHEDULER_ADMIN', 'INTAKE_ADMIN'),
    validateMonthlyAnalyticsLookup,
    exportMonthlyIntakes
);
