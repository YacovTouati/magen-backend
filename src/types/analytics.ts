export interface AnalyticsSummary {
    callerTypes: Record<string, number>;
    callPurposes: Record<string, number>;
}

export interface MonthlyIntakeAnalytics {
    year: number;
    month: number;
    totalIntakes: number;
    statusBreakdown: Record<string, number>;
    reporterBreakdown: Record<string, number>;
    // No dedicated case-type/category field exists on Intake — this buckets by the
    // linked CallReport's callPurpose (the closest existing "what kind of case is
    // this" concept), under 'ללא נושא' for intakes with no linked CallReport at all
    // (manually created via POST /intakes).
    caseTypeBreakdown: Record<string, number>;
    // One entry per calendar day of the month ("YYYY-MM-DD"), zero-filled — not just
    // the days that actually had intakes — so a chart can render the full month axis.
    dailyActivity: Record<string, number>;
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
    id: number;
    createdAt: Date;
    callerName: string;
    phone: string | null;
    email: string | null;
    reportedBy: string;
    status: string;
    caseDescription: string;
}
