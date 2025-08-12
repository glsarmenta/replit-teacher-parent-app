import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import { storage } from '../storage';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

export interface AuthToken {
  userId: string;
  tenantId: string;
  role: string;
}

export class AuthService {
  static async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, 10);
  }

  static async comparePassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  static generateToken(payload: AuthToken): string {
    return jwt.sign(payload, JWT_SECRET, { expiresIn: '24h' });
  }

  static verifyToken(token: string): AuthToken | null {
    try {
      return jwt.verify(token, JWT_SECRET) as AuthToken;
    } catch {
      return null;
    }
  }

  static async authenticateUser(email: string, password: string, tenantId: string) {
    const user = await storage.getUserByEmail(email, tenantId);
    if (!user) {
      throw new Error('Invalid credentials');
    }

    const isValid = await this.comparePassword(password, user.password);
    if (!isValid) {
      throw new Error('Invalid credentials');
    }

    await storage.updateUser(user.id, { lastLoginAt: new Date() });

    const token = this.generateToken({
      userId: user.id,
      tenantId: user.tenantId,
      role: user.role,
    });

    return {
      token,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
      },
    };
  }
}
