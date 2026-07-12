import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { UserRepository } from '../repositories/userRepository';
import { LoginPayload, AuthTokenPayload } from '../types/auth';

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '8h';

if (!JWT_SECRET) {
    throw new Error('JWT_SECRET is not set in the environment');
}

export class AuthService {
    private userRepository = new UserRepository();

    async login(payload: LoginPayload) {
        const user = await this.userRepository.findByEmail(payload.email);
        if (!user) {
            throw new Error('אימייל או סיסמה שגויים');
        }

        const passwordMatches = await bcrypt.compare(payload.password, user.password);
        if (!passwordMatches) {
            throw new Error('אימייל או סיסמה שגויים');
        }

        const tokenPayload: AuthTokenPayload = {
            id: user.id,
            email: user.email,
            role: user.role,
        };

        const token = jwt.sign(tokenPayload, JWT_SECRET as string, { expiresIn: JWT_EXPIRES_IN } as jwt.SignOptions);

        return {
            token,
            user: tokenPayload,
        };
    }
}
