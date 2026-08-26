import { AnalyticsRepository } from '../repositories/analyticsRepository';
import { AnalyticsSummary, MonthlyIntakeAnalytics, MonthlyIntakeExportRow } from '../types/analytics';

// Same "case is done" definition already used by the retention/auto-delete flow
// (see IntakeAlertsComponent.DELETION_TRIGGER_STATUSES on the frontend) — kept in
// sync deliberately, not just copy-pasted coincidentally.
const RESOLVED_STATUSES = ['CLOSED', 'LONG_TERM'];

// Bucket for every CallReport-only breakdown below, used whenever an intake has no
// linked CallReport at all (manually created via POST /intakes) rather than a real
// field value that happens to be missing.
const NO_CALL_REPORT_BUCKET = 'לא צוין';

const MS_PER_HOUR = 1000 * 60 * 60;

// "Peak call hours" is a local-time staffing question, not a UTC one — hourCycle:
// 'h23' (not hour12: false) is deliberate: some Intl implementations render local
// midnight as "24" under hour12:false, h23 is unambiguously "00".."23".
const ISRAEL_HOUR_FORMATTER = new Intl.DateTimeFormat('en-US', {
    hour: '2-digit',
    hourCycle: 'h23',
    timeZone: 'Asia/Jerusalem',
});

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
        const callerTypeBreakdown: Record<string, number> = {};
        const callPurposeBreakdown: Record<string, number> = {};
        const receivedSupportBreakdown: Record<string, number> = {};
        const magenContactHistoryBreakdown: Record<string, number> = {};
        const reportingDutyBreakdown: Record<string, number> = {};
        const regionBreakdown: Record<string, number> = {};
        const hourlyDistribution = this.buildEmptyHourlyDistribution();

        let resolvedCount = 0;
        let resolvedTotalHours = 0;

        for (const intake of intakes) {
            this.increment(statusBreakdown, intake.status);
            this.increment(reporterBreakdown, intake.reportedBy);
            this.increment(callerTypeBreakdown, intake.callReport?.callerType ?? NO_CALL_REPORT_BUCKET);
            this.increment(callPurposeBreakdown, intake.callReport?.callPurpose ?? NO_CALL_REPORT_BUCKET);
            this.increment(receivedSupportBreakdown, intake.callReport?.receivedSupportAtOtherCenter ?? NO_CALL_REPORT_BUCKET);
            this.increment(magenContactHistoryBreakdown, intake.callReport?.magenContactHistory ?? NO_CALL_REPORT_BUCKET);
            this.increment(reportingDutyBreakdown, intake.callReport?.reportingDuty ?? NO_CALL_REPORT_BUCKET);
            this.increment(regionBreakdown, this.normalizeRegion(intake.callReport?.region));

            const hourKey = ISRAEL_HOUR_FORMATTER.format(intake.createdAt);
            hourlyDistribution[hourKey] = (hourlyDistribution[hourKey] ?? 0) + 1;

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
            callerTypeBreakdown,
            callPurposeBreakdown,
            receivedSupportBreakdown,
            magenContactHistoryBreakdown,
            reportingDutyBreakdown,
            regionBreakdown,
            hourlyDistribution,
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
            createdAt: intake.createdAt,
            callerName: intake.callerName,
            callerType: intake.callReport?.callerType ?? null,
            callPurpose: intake.callReport?.callPurpose ?? null,
            region: intake.callReport ? this.normalizeRegion(intake.callReport.region) : null,
            receivedSupportAtOtherCenter: intake.callReport?.receivedSupportAtOtherCenter ?? null,
            magenContactHistory: intake.callReport?.magenContactHistory ?? null,
            reportingDuty: intake.callReport?.reportingDuty ?? null,
            reportedBy: intake.reportedBy,
            status: intake.status,
            caseDescription: intake.caseDescription,
        }));
    }

    private increment(breakdown: Record<string, number>, key: string): void {
        breakdown[key] = (breakdown[key] ?? 0) + 1;
    }

    // Trims surrounding whitespace and collapses internal runs of whitespace to a
    // single space, so "תל אביב", " תל  אביב", "תל אביב " all group under one key.
    // Deliberately not fuzzy/typo-correcting beyond that — see the endpoint's own
    // docs on why free-text normalization stops here.
    private normalizeRegion(rawRegion: string | null | undefined): string {
        const normalized = rawRegion?.trim().replace(/\s+/g, ' ');
        return normalized ? normalized : NO_CALL_REPORT_BUCKET;
    }

    private buildEmptyHourlyDistribution(): Record<string, number> {
        const activity: Record<string, number> = {};
        for (let hour = 0; hour < 24; hour++) {
            activity[String(hour).padStart(2, '0')] = 0;
        }
        return activity;
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
