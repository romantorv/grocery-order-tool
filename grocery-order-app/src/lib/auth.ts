import jwt from 'jsonwebtoken';
import { NextRequest } from 'next/server';
import connectDB from './mongodb';
import User, { IUser } from '@/models/User';
import AppSettings from '@/models/AppSettings';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

export interface SessionUser {
  _id: string;
  displayName: string;
  role: 'member' | 'admin';
  sessionId: string;
}

export async function generateSessionToken(user: IUser): Promise<string> {
  const payload = {
    userId: String(user._id),
    displayName: user.displayName,
    role: user.role,
    sessionId: user.sessionId
  };

  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
}

interface JWTPayload {
  userId: string;
  displayName: string;
  role: 'member' | 'admin';
  sessionId: string;
}

export async function validateSession(req: NextRequest): Promise<SessionUser | null> {
  try {
    const authHeader = req.headers.get('authorization');
    const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;

    if (!token) {
      return null;
    }

    const decoded = jwt.verify(token, JWT_SECRET) as JWTPayload;

    await connectDB();
    const user = await User.findOne({
      _id: decoded.userId,
      sessionId: decoded.sessionId
    });

    if (!user) {
      return null;
    }

    // Update last active timestamp
    user.lastActive = new Date();
    await user.save();

    return {
      _id: user._id.toString(),
      displayName: user.displayName,
      role: user.role,
      sessionId: user.sessionId
    };
  } catch {
    return null;
  }
}

export async function validateAccessCode(code: string, role: 'member' | 'admin'): Promise<boolean> {
  await connectDB();

  const settingKey = role === 'admin' ? 'admin_access_code' : 'member_access_code';
  const setting = await AppSettings.findOne({ key: settingKey });

  return setting?.value === code;
}

export async function createUserSession(displayName: string, role: 'member' | 'admin'): Promise<IUser> {
  await connectDB();

  const sessionId = generateSessionId();

  const user = await User.create({
    displayName,
    role,
    sessionId,
    lastActive: new Date()
  });

  return user;
}

function generateSessionId(): string {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
}

export async function initializeAppSettings() {
  await connectDB();

  const settings = [
    {
      key: 'member_access_code',
      value: process.env.MEMBER_ACCESS_CODE,
      description: 'Access code for members'
    },
    {
      key: 'admin_access_code',
      value: process.env.ADMIN_ACCESS_CODE,
      description: 'Access code for administrators'
    }
  ];

  for (const setting of settings) {
    const existing = await AppSettings.findOne({ key: setting.key });
    if (!existing) {
      await AppSettings.create(setting);
    }
  }
}