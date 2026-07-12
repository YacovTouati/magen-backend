import bcrypt from 'bcrypt';
import { UserRepository } from '../repositories/userRepository';
import { CreateUserPayload } from '../types/user';

export class UserService {
    private userRepository = new UserRepository();

    async getAllUsers() {
        return this.userRepository.getAllUsers();
    }

    async createUser(payload: CreateUserPayload) {
        const hashedPassword = await bcrypt.hash(payload.password, 10);
        return this.userRepository.createUser({
            ...payload,
            password: hashedPassword,
        });
    }

    async deleteUser(id: number) {
        return this.userRepository.deleteUser(id);
    }
}
