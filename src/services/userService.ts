import bcrypt from 'bcrypt';
import { HttpError } from '../errors/httpError';
import { UserRepository } from '../repositories/userRepository';
import { UserRole } from '../types/user';

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
