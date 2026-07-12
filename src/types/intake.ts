export type IntakeUrgency = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';

export type IntakeStatus = 'NEW' | 'NO_ANSWER' | 'ACTIVE' | 'CLOSED' | 'LONG_TERM';

export interface UpdateIntakeStatusPayload {
    status: IntakeStatus;
}
