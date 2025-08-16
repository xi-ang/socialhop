import jwt, { SignOptions } from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

// 确保 JWT_SECRET 不为空
if (!JWT_SECRET || JWT_SECRET === '' || JWT_SECRET.length < 8) {
  throw new Error('JWT_SECRET environment variable is required and must be at least 8 characters');
}

export interface JwtPayload {
  userId: string;
  email: string;
  username: string;
}

export class JwtService {
  static sign(payload: JwtPayload): string {
    return jwt.sign(payload, JWT_SECRET as string, {
      expiresIn: '7d',
    });
  }

  static verify(token: string): JwtPayload | null {
    try {
      return jwt.verify(token, JWT_SECRET as string) as JwtPayload;
    } catch (error) {
      return null;
    }
  }

  static async hashPassword(password: string): Promise<string> {
    const saltRounds = 12;
    return bcrypt.hash(password, saltRounds);
  }

  static async comparePassword(password: string, hashedPassword: string): Promise<boolean> {
    return bcrypt.compare(password, hashedPassword);
  }
}
