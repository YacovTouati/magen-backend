import { ReportRepository } from '../repositories/reportRepository';
import { IntakeAlertService } from './intakeAlertService';
import { CallReport, CallPurpose, ReceivedSupportAtOtherCenter } from '../types/report';
import { IntakeUrgency } from '../types/intake';

// שיחת מצוקה נכנסת כתיק בעדיפות קריטית; כפייה כגבוהה; ייעוץ כבינונית — עד שתהיה שדה ייעודי בטופס
const CALL_PURPOSE_TO_URGENCY: Record<CallPurpose, IntakeUrgency> = {
    crisis: 'CRITICAL',
    coercion: 'HIGH',
    counseling: 'MEDIUM',
};

const RECEIVED_SUPPORT_TO_HEBREW: Record<ReceivedSupportAtOtherCenter, string> = {
    yes: 'כן',
    no: 'לא',
    unknown: 'לא ידוע',
};

export class ReportService {
    private reportRepository = new ReportRepository();
    private intakeAlertService = new IntakeAlertService();

    async processAndSaveReport(rawData: CallReport) {
        // כאן בעתיד נוכל לעשות מניפולציות (למשל: לוגיקה לבדיקה אם הטלפון כבר קיים במערכת בעבר)

        const { report, intake } = await this.reportRepository.saveReportWithIntake(rawData, {
            urgency: CALL_PURPOSE_TO_URGENCY[rawData.callPurpose],
            contactedOtherCenter: RECEIVED_SUPPORT_TO_HEBREW[rawData.receivedSupportAtOtherCenter],
        });

        // Fire-and-forget — never awaited, so a slow/failing notification email
        // can't delay or fail this response (see IntakeAlertService's own comment).
        void this.intakeAlertService.notifyNewIntake(intake);

        return { report, intake };
    }
}
