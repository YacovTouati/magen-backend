export interface AnalyticsSummary {
    callerTypes: Record<string, number>;
    callPurposes: Record<string, number>;
}

// Every *Breakdown field below whose source is CallReport-only (callerType,
// callPurpose, receivedSupport, magenContactHistory, reportingDuty, region) buckets
// intakes with no linked CallReport (manually created via POST /intakes) under
// NO_CALL_REPORT_BUCKET ('לא צוין') rather than dropping them from the count.
export interface MonthlyIntakeAnalytics {
    year: number;
    month: number;
    totalIntakes: number;
    statusBreakdown: Record<string, number>;
    reporterBreakdown: Record<string, number>;
    callerTypeBreakdown: Record<string, number>;
    callPurposeBreakdown: Record<string, number>;
    receivedSupportBreakdown: Record<string, number>;
    magenContactHistoryBreakdown: Record<string, number>;
    reportingDutyBreakdown: Record<string, number>;
    // Keyed by normalized region text (trimmed, internal whitespace collapsed) — the
    // full map, not pre-folded into a "top N + other" shape; that's a presentation
    // decision left to whichever client renders it (see e.g. how reporterBreakdown
    // is already consumed: full map from the API, folded to "top 7 + אחר" client-side).
    regionBreakdown: Record<string, number>;
    // One entry per hour of the day ("00".."23"), zero-filled, bucketed by Israel
    // local time (Asia/Jerusalem, DST-aware) rather than the UTC storage timezone —
    // a "peak call hours" staffing insight needs the hour calls actually happened
    // locally, not the raw UTC offset.
    hourlyDistribution: Record<string, number>;
    resolutionStats: {
        resolvedCount: number;
        // Hours between createdAt and updatedAt for CLOSED/LONG_TERM intakes — an
        // approximation, since there's no dedicated resolvedAt/closedAt timestamp;
        // updatedAt reflects the row's last change of any kind, not specifically
        // the status transition into a terminal state. null when resolvedCount is 0.
        averageResolutionHours: number | null;
        completionRate: number; // resolvedCount / totalIntakes, 0 when totalIntakes is 0
    };
}

export interface MonthlyIntakeExportRow {
    createdAt: Date;
    callerName: string;
    callerType: string | null;
    callPurpose: string | null;
    region: string | null;
    receivedSupportAtOtherCenter: string | null;
    magenContactHistory: string | null;
    reportingDuty: string | null;
    reportedBy: string;
    status: string;
    caseDescription: string;
}
