import { Request, Response } from 'express';
import { AnalyticsService } from '../services/analyticsService';
import { buildCsv } from '../utils/csv';

const analyticsService = new AnalyticsService();

// Hebrew display labels — duplicated from the frontend's own label maps
// (src/app/shared/intake-labels.ts) rather than shared, since this backend has no
// existing shared-label utility; keep these in sync if a value is ever added/renamed.
// Falls through to the raw value for anything unrecognized, including the
// analytics service's own 'לא צוין' bucket (already Hebrew, needs no translation).
const STATUS_LABELS: Record<string, string> = {
    NEW: 'חדש',
    NO_ANSWER: 'לא ענה - לנסות שוב',
    ACTIVE: 'בטיפול פעיל',
    CLOSED: 'נסגר בשיחה קצרה',
    LONG_TERM: 'המשך לטיפול ארוך',
};

const CALLER_TYPE_LABELS: Record<string, string> = {
    victim: 'נפגע/ת ישיר/ה',
    family: 'בן/בת משפחה',
    friend: 'חבר/ה או מכר/ה',
    unknown: 'אנונימי',
    general_inquiry: 'נועץ כללי',
};

const CALL_PURPOSE_LABELS: Record<string, string> = {
    counseling: 'ייעוץ ותמיכה רגשית',
    referral: 'הפנייה לטיפול',
    legal_process: 'ליווי בהליך משפטי',
    rights_advocacy: 'מיצוי זכויות',
    crisis: 'מצב חירום אקוטי',
    other: 'אחר / מספר נושאים',
    // Legacy value — no longer selectable (see validators.ts), kept only so a
    // historical CallReport row still renders in Hebrew instead of falling
    // through to the raw English slug.
    coercion: 'דיווח על כפייה או פגיעה (ערך ישן)',
};

const RECEIVED_SUPPORT_LABELS: Record<string, string> = {
    yes: 'כן',
    no: 'לא',
    unknown: 'לא ידוע',
};

const MAGEN_CONTACT_HISTORY_LABELS: Record<string, string> = {
    first_time: 'פעם ראשונה',
    past: 'פנה בעבר',
    dont_remember: 'לא ידוע',
};

const REPORTING_DUTY_LABELS: Record<string, string> = {
    no: 'לא',
    yes_practical: 'כן מעשי',
    yes_principled: 'כן עקרוני',
};

const labelOrRaw = (labels: Record<string, string>, value: string | null): string => {
    if (!value) {
        return '-';
    }
    return labels[value] ?? value;
};

const EXPORT_HEADERS = [
    'תאריך',
    'שם הפונה',
    'סוג פונה',
    'מטרת שיחה',
    'אזור בארץ',
    'ליווי במרכז אחר',
    'פנה למגן בעבר',
    'חובת דיווח',
    'מי הכניס את הדיווח',
    'סטטוס',
    'תיאור/תוכן',
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
            row.callerName,
            labelOrRaw(CALLER_TYPE_LABELS, row.callerType),
            labelOrRaw(CALL_PURPOSE_LABELS, row.callPurpose),
            row.region ?? '-',
            labelOrRaw(RECEIVED_SUPPORT_LABELS, row.receivedSupportAtOtherCenter),
            labelOrRaw(MAGEN_CONTACT_HISTORY_LABELS, row.magenContactHistory),
            labelOrRaw(REPORTING_DUTY_LABELS, row.reportingDuty),
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
