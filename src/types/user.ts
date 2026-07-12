export type UserRole = 'ADMIN' | 'VOLUNTEER';

export interface CreateUserPayload {
    email: string;
    password: string;
    name: string;
    role: UserRole;
}
