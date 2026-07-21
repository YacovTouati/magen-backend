export type UserRole = 'SUPER_ADMIN' | 'INTAKE_ADMIN' | 'SCHEDULER_ADMIN' | 'VOLUNTEER';

// Admin no longer sets passwords directly (see InviteUserPayload) — this is
// only what the repository needs internally once registration has already
// hashed the invitee's own chosen password.
export interface CreateRegisteredUserPayload {
    email: string;
    password: string;
    name: string;
    phone: string;
    role: UserRole;
}

export interface InviteUserPayload {
    email: string;
    role: UserRole;
    invitedById: number;
}

export interface RegisterPayload {
    email: string;
    password: string;
    name: string;
    phone: string;
    token: string;
}

export interface ChangePasswordPayload {
    currentPassword: string;
    newPassword: string;
}
