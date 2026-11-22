import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from './prisma';
import { AuthUser } from '@/types';

const JWT_SECRET = process.env.JWT_SECRET || 'twincare-secret';
const JWT_EXPIRES = '7d';

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function signToken(user: AuthUser): string {
  return jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, {
    expiresIn: JWT_EXPIRES,
  });
}

export function verifyToken(token: string): AuthUser | null {
  try {
    const payload = jwt.verify(token, JWT_SECRET) as AuthUser & { iat: number; exp: number };
    return { id: payload.id, email: payload.email };
  } catch {
    return null;
  }
}

export async function getUserFromRequest(req: Request): Promise<AuthUser | null> {
  const authHeader = req.headers.get('authorization');
  const cookieHeader = req.headers.get('cookie');

  let token: string | null = null;

  if (authHeader?.startsWith('Bearer ')) {
    token = authHeader.slice(7);
  } else if (cookieHeader) {
    const match = cookieHeader.match(/tc_token=([^;]+)/);
    if (match) token = match[1];
  }

  if (!token) return null;
  return verifyToken(token);
}

export async function createUserSession(userId: string): Promise<string> {
  const token = signToken({ id: userId, email: '' });
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  await prisma.session.create({
    data: { userId, token, expiresAt },
  });

  return token;
}
