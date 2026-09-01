export type CallerType = 'victim' | 'family' | 'friend' | 'unknown' | 'general_inquiry';
// 'coercion' was removed from the selectable set — no longer valid on new submissions
// (see validators.ts), but historical CallReport rows may still hold it; analytics/CSV
// label maps keep an explicit legacy entry so those old rows still render in Hebrew.
export type CallPurpose = 'counseling' | 'referral' | 'legal_process' | 'rights_advocacy' | 'crisis' | 'other';
export type Gender = 'male' | 'female' | 'other' | 'unknown';
export type Sector = 'secular' | 'traditional' | 'religious' | 'ultra_orthodox' | 'arab' | 'other';
export type MagenContactHistory = 'first_time' | 'past' | 'dont_remember';
export type ReceivedSupportAtOtherCenter = 'yes' | 'no' | 'unknown';
export type ReportingDuty = 'no' | 'yes_practical' | 'yes_principled';

export interface CallReport {
    callDuration: number;
    callerType: CallerType;
    callPurpose: CallPurpose;
    summaryNotes: string;
    callerName: string;
    phone: string | null;
    email: string | null;
    region: string;
    gender: Gender;
    sector: Sector;
    receivedSupportAtOtherCenter: ReceivedSupportAtOtherCenter;
    magenContactHistory: MagenContactHistory;
    reportingDuty?: ReportingDuty | null;
    reportedBy: string;
    createdById?: number | null;
}
