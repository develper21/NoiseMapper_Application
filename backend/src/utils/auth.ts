import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { eq } from 'drizzle-orm';
import { db } from '../db';
import { users, userSessions } from '../db/schema';

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production';
const JWT_EXPIRES_IN = '7d';

export class AuthError extends Error {
  constructor(message: string, public code?: string) {
    super(message);
    this.name = 'AuthError';
  }
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function generateToken(userId: string): string {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

export function verifyToken(token: string): { userId: string } {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
    return decoded;
  } catch (error) {
    throw new AuthError('Invalid token', 'INVALID_TOKEN');
  }
}

export async function createSession(userId: string, token: string): Promise<void> {
  const tokenHash = await hashPassword(token);
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7); // 7 days from now

  await db.insert(userSessions).values({
    user_id: userId,
    token_hash: tokenHash,
    expires_at: expiresAt,
  });
}

export async function validateSession(token: string): Promise<{ userId: string } | null> {
  try {
    const decoded = verifyToken(token);
    const tokenHash = await hashPassword(token);

    const session = await db
      .select()
      .from(userSessions)
      .where(eq(userSessions.token_hash, tokenHash))
      .limit(1);

    if (session.length === 0 || session[0].expires_at < new Date()) {
      return null;
    }

    return { userId: decoded.userId };
  } catch (error) {
    return null;
  }
}

export async function invalidateSession(token: string): Promise<void> {
  const tokenHash = await hashPassword(token);
  await db.delete(userSessions).where(eq(userSessions.token_hash, tokenHash));
}

export async function invalidateAllSessions(userId: string): Promise<void> {
  await db.delete(userSessions).where(eq(userSessions.user_id, userId));
}
