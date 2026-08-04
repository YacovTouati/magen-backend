export type CallerType = 'victim' | 'family' | 'friend';
export type CallPurpose = 'counseling' | 'coercion' | 'crisis';
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
    phone: string;
    email: string | null;
    region: string;
    gender: Gender;
    sector: Sector;
    receivedSupportAtOtherCenter: ReceivedSupportAtOtherCenter;
    isFamilyMemberOrAcquaintance: boolean;
    magenContactHistory: MagenContactHistory;
    reportingDuty?: ReportingDuty | null;
    createdById?: number | null;
}
