import { ReportRepository } from '../repositories/reportRepository';
import { CallReport } from '../types/report';

export class ReportService {
    private reportRepository = new ReportRepository();

    async processAndSaveReport(rawData: CallReport) {
        // כאן בעתיד נוכל לעשות מניפולציות (למשל: לוגיקה לבדיקה אם הטלפון כבר קיים במערכת בעבר)

        const savedRecord = await this.reportRepository.saveReport(rawData);
        return savedRecord;
    }
}