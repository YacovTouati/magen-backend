import prisma from '../db/prisma';
import { CallReport } from '../types/report';
import { IntakeUrgency } from '../types/intake';

interface IntakeDerivedFields {
    urgency: IntakeUrgency;
    contactedOtherCenter: string;
}

export class ReportRepository {
    // Creates the CallReport and its linked Intake atomically, so a submitted
    // call report can never exist without a corresponding case for admins to work.
    async saveReportWithIntake(reportData: CallReport, intakeFields: IntakeDerivedFields) {
        return prisma.$transaction(async (tx) => {
            const report = await tx.callReport.create({ data: reportData });

            const intake = await tx.intake.create({
                data: {
                    callerName: report.callerName,
                    phone: report.phone,
                    contactedOtherCenter: intakeFields.contactedOtherCenter,
                    caseDescription: report.summaryNotes,
                    urgency: intakeFields.urgency,
                    status: 'NEW',
                    assignedToId: null,
                    callReportId: report.id,
                },
            });

            return { report, intake };
        });
    }
}
