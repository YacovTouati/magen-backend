import { AnalyticsRepository } from '../repositories/analyticsRepository';
import { AnalyticsSummary, MonthlyIntakeAnalytics, MonthlyIntakeExportRow } from '../types/analytics';

// Same "case is done" definition already used by the retention/auto-delete flow
// (see IntakeAlertsComponent.DELETION_TRIGGER_STATUSES on the frontend) — kept in
// sync deliberately, not just copy-pasted coincidentally.
const RESOLVED_STATUSES = ['CLOSED', 'LONG_TERM'];

const NO_CASE_TYPE_BUCKET = 'ללא נושא';

const MS_PER_HOUR = 1000 * 60 * 60;

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

    async getMonthlyIntakeAnalytics(year: number, month: number): Promise<MonthlyIntakeAnalytics> {
        const intakes = await this.analyticsRepository.findIntakesByMonth(year, month);

        const statusBreakdown: Record<string, number> = {};
        const reporterBreakdown: Record<string, number> = {};
        const caseTypeBreakdown: Record<string, number> = {};
        const dailyActivity = this.buildEmptyDailyActivity(year, month);

        let resolvedCount = 0;
        let resolvedTotalHours = 0;

        for (const intake of intakes) {
            statusBreakdown[intake.status] = (statusBreakdown[intake.status] ?? 0) + 1;
            reporterBreakdown[intake.reportedBy] = (reporterBreakdown[intake.reportedBy] ?? 0) + 1;

            const caseType = intake.callReport?.callPurpose ?? NO_CASE_TYPE_BUCKET;
            caseTypeBreakdown[caseType] = (caseTypeBreakdown[caseType] ?? 0) + 1;

            const dayKey = this.toDateKey(intake.createdAt);
            dailyActivity[dayKey] = (dailyActivity[dayKey] ?? 0) + 1;

            if (RESOLVED_STATUSES.includes(intake.status)) {
                resolvedCount += 1;
                resolvedTotalHours += (intake.updatedAt.getTime() - intake.createdAt.getTime()) / MS_PER_HOUR;
            }
        }

        return {
            year,
            month,
            totalIntakes: intakes.length,
            statusBreakdown,
            reporterBreakdown,
            caseTypeBreakdown,
            dailyActivity,
            resolutionStats: {
                resolvedCount,
                averageResolutionHours: resolvedCount > 0 ? resolvedTotalHours / resolvedCount : null,
                completionRate: intakes.length > 0 ? resolvedCount / intakes.length : 0,
            },
        };
    }

    async getIntakesForExport(year: number, month: number): Promise<MonthlyIntakeExportRow[]> {
        const intakes = await this.analyticsRepository.findIntakesByMonth(year, month);
        return intakes.map((intake) => ({
            id: intake.id,
            createdAt: intake.createdAt,
            callerName: intake.callerName,
            phone: intake.phone,
            email: intake.callReport?.email ?? null,
            reportedBy: intake.reportedBy,
            status: intake.status,
            caseDescription: intake.caseDescription,
        }));
    }

    private buildEmptyDailyActivity(year: number, month: number): Record<string, number> {
        const daysInMonth = new Date(year, month, 0).getDate();
        const activity: Record<string, number> = {};
        for (let day = 1; day <= daysInMonth; day++) {
            const key = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            activity[key] = 0;
        }
        return activity;
    }

    // UTC, matching how findIntakesByMonth's range itself is computed — avoids a
    // createdAt near local midnight landing on the "wrong" day in dailyActivity.
    private toDateKey(date: Date): string {
        return date.toISOString().slice(0, 10);
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
