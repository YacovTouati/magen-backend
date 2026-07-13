import { AnalyticsRepository } from '../repositories/analyticsRepository';
import { AnalyticsSummary } from '../types/analytics';

export class AnalyticsService {
    private analyticsRepository = new AnalyticsRepository();

    async getSummary(): Promise<AnalyticsSummary> {
        const [callerTypeCounts, callPurposeCounts] = await Promise.all([
            this.analyticsRepository.countByCallerType(),
            this.analyticsRepository.countByCallPurpose(),
        ]);

        return {
            callerTypes: this.toCountMap(callerTypeCounts, (row) => row.callerType),
            callPurposes: this.toCountMap(callPurposeCounts, (row) => row.callPurpose),
        };
    }

    private toCountMap<T extends { _count: { _all: number } }>(
        rows: T[],
        getKey: (row: T) => string
    ): Record<string, number> {
        return rows.reduce<Record<string, number>>((acc, row) => {
            acc[getKey(row)] = row._count._all;
            return acc;
        }, {});
    }
}
