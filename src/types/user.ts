export type UserRole = 'SUPER_ADMIN' | 'INTAKE_ADMIN' | 'SCHEDULER_ADMIN' | 'VOLUNTEER';

export interface CreateUserPayload {
    email: string;
    password: string;
    name: string;
    role: UserRole;
}
