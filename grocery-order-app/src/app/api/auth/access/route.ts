import { NextRequest, NextResponse } from 'next/server';
import { validateAccessCode, createUserSession, generateSessionToken } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { displayName, accessCode } = body;

    if (!displayName || !accessCode) {
      return NextResponse.json(
        { error: 'Display name and access code are required' },
        { status: 400 }
      );
    }

    if (displayName.length < 1 || displayName.length > 50) {
      return NextResponse.json(
        { error: 'Display name must be between 1 and 50 characters' },
        { status: 400 }
      );
    }

    // Determine role based on access code
    let role: 'member' | 'admin';
    const isAdmin = await validateAccessCode(accessCode, 'admin');
    const isMember = await validateAccessCode(accessCode, 'member');

    if (isAdmin) {
      role = 'admin';
    } else if (isMember) {
      role = 'member';
    } else {
      return NextResponse.json(
        { error: 'Invalid access code' },
        { status: 401 }
      );
    }

    // Create user session
    const user = await createUserSession(displayName, role);
    const token = await generateSessionToken(user);

    return NextResponse.json({
      success: true,
      user: {
        displayName: user.displayName,
        role: user.role,
        sessionId: user.sessionId
      },
      token
    });
  } catch (error) {
    console.error('Auth error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}