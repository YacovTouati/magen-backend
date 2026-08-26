import prisma from '../db/prisma';

export class AnalyticsRepository {
    async countByCallerType() {
        return prisma.callReport.groupBy({
            by: ['callerType'],
            _count: { _all: true },
        });
    }

    async countByCallPurpose() {
        return prisma.callReport.groupBy({
            by: ['callPurpose'],
            _count: { _all: true },
        });
    }

    // Backs both the monthly analytics aggregation and the CSV export — one shared
    // query/shape rather than two slightly different ones, since export is really
    // just "the same monthly intake rows, unaggregated." Trimmed to exactly the
    // fields either consumer needs — no phone/email/id, neither is used by either
    // one anymore (see AnalyticsService/analyticsController).
    async findIntakesByMonth(year: number, month: number) {
        const start = new Date(Date.UTC(year, month - 1, 1));
        const end = new Date(Date.UTC(year, month, 1));

        return prisma.intake.findMany({
            where: { createdAt: { gte: start, lt: end } },
            select: {
                callerName: true,
                status: true,
                reportedBy: true,
                caseDescription: true,
                createdAt: true,
                updatedAt: true,
                callReport: {
                    select: {
                        callerType: true,
                        callPurpose: true,
                        region: true,
                        receivedSupportAtOtherCenter: true,
                        magenContactHistory: true,
                        reportingDuty: true,
                    },
                },
            },
            orderBy: { createdAt: 'asc' },
        });
    }
}
