import { UserRole } from './user';

export interface LoginPayload {
    email: string;
    password: string;
}

export interface AuthTokenPayload {
    id: number;
    email: string;
    role: UserRole;
}
