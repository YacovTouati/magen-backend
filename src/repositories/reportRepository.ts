import prisma from '../db/prisma';
import { CallReport } from '../types/report';

export class ReportRepository {
    async saveReport(reportData: CallReport) {
        const savedRow = await prisma.callReport.create({
            data: reportData,
        });
        return savedRow;
    }
}