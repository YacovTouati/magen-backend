import { ReportRepository } from '../repositories/reportRepository';
import { CallReport, CallPurpose } from '../types/report';
import { IntakeUrgency } from '../types/intake';

// שיחת מצוקה נכנסת כתיק בעדיפות קריטית; כפייה כגבוהה; ייעוץ כבינונית — עד שתהיה שדה ייעודי בטופס
const CALL_PURPOSE_TO_URGENCY: Record<CallPurpose, IntakeUrgency> = {
    crisis: 'CRITICAL',
    coercion: 'HIGH',
    counseling: 'MEDIUM',
};

export class ReportService {
    private reportRepository = new ReportRepository();

    async processAndSaveReport(rawData: CallReport) {
        // כאן בעתיד נוכל לעשות מניפולציות (למשל: לוגיקה לבדיקה אם הטלפון כבר קיים במערכת בעבר)

        const { report, intake } = await this.reportRepository.saveReportWithIntake(rawData, {
            urgency: CALL_PURPOSE_TO_URGENCY[rawData.callPurpose],
            contactedOtherCenter: rawData.contactedOtherCenterBefore ? 'כן' : 'לא',
        });

        return { report, intake };
    }
}
