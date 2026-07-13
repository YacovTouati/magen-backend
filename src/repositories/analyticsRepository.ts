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
}
