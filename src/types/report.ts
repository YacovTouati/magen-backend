export type CallerType = 'victim' | 'family' | 'friend';
export type CallPurpose = 'counseling' | 'coercion' | 'crisis';
export type Region = 'north' | 'center' | 'south' | 'jerusalem' | 'haifa' | 'judea_samaria';
export type Gender = 'male' | 'female' | 'other' | 'unknown';
export type Sector = 'secular' | 'traditional' | 'religious' | 'ultra_orthodox' | 'arab' | 'other';

export interface CallReport {
    callDuration: number;
    callerType: CallerType;
    callPurpose: CallPurpose;
    summaryNotes: string;
    callerName: string;
    phone: string;
    email: string | null;
    region: Region;
    gender: Gender;
    sector: Sector;
    contactedOtherCenterBefore: boolean;
}
