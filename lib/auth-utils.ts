import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET ?? 'fintrack-secret-key';

export interface SessionUser {
  id: string;
  name: string;
}

export async function createSession(user: SessionUser): Promise<string> {
  const token = jwt.sign({ id: user.id, name: user.name }, JWT_SECRET, { expiresIn: '30d' });
  const cookieStore = await cookies();
  cookieStore.set('fintrack-session', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 30 * 24 * 60 * 60,
  });
  return token;
}

export async function getSession(): Promise<SessionUser | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('fintrack-session')?.value;
    if (!token) return null;
    const decoded = jwt.verify(token, JWT_SECRET) as SessionUser;
    return decoded;
  } catch {
    return null;
  }
}

export async function clearSession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete('fintrack-session');
}
