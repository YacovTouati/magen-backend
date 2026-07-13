export interface UpsertAssignmentPayload {
    date: string; // ISO date (YYYY-MM-DD) — one assignment per calendar day
    volunteerId: number;
}
