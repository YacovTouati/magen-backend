import bcrypt from 'bcrypt';
import { Prisma } from '../generated/prisma/client';
import { HttpError } from '../errors/httpError';
import { UserRepository } from '../repositories/userRepository';
import { UserRole } from '../types/user';

interface UpdateUserDetailsPayload {
    name?: string;
    email?: string;
    role?: UserRole;
}

export class UserService {
    private userRepository = new UserRepository();

    async getAllUsers() {
        return this.userRepository.getAllUsers();
    }

    async deleteUser(id: number) {
        return this.userRepository.deleteUser(id);
    }

    async updateUserRole(id: number, role: UserRole) {
        return this.userRepository.updateRole(id, role);
    }

    // Pre-checks email uniqueness (excluding the user's own current row, so
    // re-submitting an unchanged email isn't rejected as "taken") and still
    // catches P2002 from the write itself as a defense against a concurrent
    // registration/edit winning the same email in the gap between the two —
    // same belt-and-suspenders pattern already used at AuthService.register.
    async updateUserDetails(id: number, payload: UpdateUserDetailsPayload) {
        if (payload.email) {
            const existing = await this.userRepository.findByEmail(payload.email);
            if (existing && existing.id !== id) {
                throw new HttpError(409, 'כתובת המייל כבר בשימוש על ידי משתמש אחר');
            }
        }

        try {
            return await this.userRepository.updateDetails(id, payload);
        } catch (error) {
            if (error instanceof Prisma.PrismaClientKnownRequestError) {
                if (error.code === 'P2025') {
                    throw new HttpError(404, 'משתמש לא נמצא');
                }
                if (error.code === 'P2002') {
                    throw new HttpError(409, 'כתובת המייל כבר בשימוש על ידי משתמש אחר');
                }
            }
            throw error;
        }
    }

    // Refuses to set this on any role other than SUPER_ADMIN — the atomic update
    // in the repository already enforces this in its WHERE clause; this just
    // reports *why* 0 rows were affected (user missing vs. wrong role) instead of
    // silently no-oping.
    async updateIntakeAlerts(id: number, receiveIntakeAlerts: boolean) {
        const result = await this.userRepository.updateIntakeAlertsIfSuperAdmin(id, receiveIntakeAlerts);
        if (result.count === 0) {
            const user = await this.userRepository.findById(id);
            if (!user) {
                throw new HttpError(404, 'משתמש לא נמצא');
            }
            throw new HttpError(400, 'ניתן להפעיל התראות דיווח חדש רק עבור משתמשי מנהל ראשי');
        }
        return this.userRepository.findByIdPublic(id);
    }

    async changePassword(userId: number, currentPassword: string, newPassword: string) {
        const user = await this.userRepository.findById(userId);
        if (!user) {
            throw new HttpError(404, 'משתמש לא נמצא');
        }

        const currentMatches = await bcrypt.compare(currentPassword, user.password);
        if (!currentMatches) {
            throw new HttpError(401, 'הסיסמה הנוכחית שגויה');
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);
        await this.userRepository.updatePassword(user.id, hashedPassword);
    }
}
