import { Request, Response } from 'express';
import { AnalyticsService } from '../services/analyticsService';
import { buildCsv } from '../utils/csv';

const analyticsService = new AnalyticsService();

// Hebrew display labels for IntakeStatus — duplicated from the frontend's own
// STATUS_LABELS (IntakeAlertsComponent / IntakesListComponent) rather than shared,
// since this backend has no existing shared-label utility; keep these two in sync
// if a status is ever added/renamed.
const STATUS_LABELS: Record<string, string> = {
    NEW: 'חדש',
    NO_ANSWER: 'לא ענה - לנסות שוב',
    ACTIVE: 'בטיפול פעיל',
    CLOSED: 'נסגר בשיחה קצרה',
    LONG_TERM: 'המשך לטיפול ארוך',
};

const EXPORT_HEADERS = [
    'תאריך',
    'מזהה אינטייק',
    'שם הפונה',
    'טלפון',
    'אימייל',
    'מי הכניס את הדיווח',
    'סטטוס',
    'תיאור/נושא',
];

const handleError = (res: Response, error: unknown) => {
    console.error('⛔ Analytics controller error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
};

export const getAnalyticsSummary = async (req: Request, res: Response) => {
    try {
        const summary = await analyticsService.getSummary();
        return res.status(200).json({ success: true, data: summary });
    } catch (error) {
        return handleError(res, error);
    }
};

export const getMonthlyAnalytics = async (req: Request, res: Response) => {
    try {
        const year = Number(req.query.year);
        const month = Number(req.query.month);
        const analytics = await analyticsService.getMonthlyIntakeAnalytics(year, month);
        return res.status(200).json({ success: true, data: analytics });
    } catch (error) {
        return handleError(res, error);
    }
};

export const exportMonthlyIntakes = async (req: Request, res: Response) => {
    try {
        const year = Number(req.query.year);
        const month = Number(req.query.month);
        const rows = await analyticsService.getIntakesForExport(year, month);

        const csvRows = rows.map((row) => [
            row.createdAt.toISOString().slice(0, 10),
            String(row.id),
            row.callerName,
            row.phone ?? '',
            row.email ?? '',
            row.reportedBy,
            STATUS_LABELS[row.status] ?? row.status,
            row.caseDescription,
        ]);
        const csv = buildCsv(EXPORT_HEADERS, csvRows);

        const filename = `intakes-${year}-${String(month).padStart(2, '0')}.csv`;
        res.setHeader('Content-Type', 'text/csv; charset=utf-8');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        return res.status(200).send(csv);
    } catch (error) {
        return handleError(res, error);
    }
};
