export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { generateAuthenticationOptions } from '@simplewebauthn/server';
import { prisma } from '@/lib/prisma';

export async function POST() {
  try {
    const rpID = process.env.NEXTAUTH_URL ? new URL(process.env.NEXTAUTH_URL).hostname : 'localhost';

    const user = await prisma.user.findFirst();
    if (!user) {
      return NextResponse.json({ error: 'No hay usuario registrado', needsSetup: true }, { status: 404 });
    }

    const credentials = await prisma.webAuthnCredential.findMany({
      where: { userId: user.id },
    });

    if (credentials.length === 0) {
      return NextResponse.json({ error: 'No hay credenciales', needsSetup: true }, { status: 404 });
    }

    const options = await generateAuthenticationOptions({
      rpID,
      allowCredentials: credentials.map((c: any) => ({
        id: c.credentialId,
        transports: c.transports as any[],
      })),
      userVerification: 'required',
    });

    // Store challenge
    await prisma.authChallenge.create({
      data: {
        challenge: options.challenge,
        userId: user.id,
        expiresAt: new Date(Date.now() + 5 * 60 * 1000),
      },
    });

    return NextResponse.json({ options, userId: user.id });
  } catch (error: any) {
    console.error('Auth options error:', error);
    return NextResponse.json({ error: error?.message ?? 'Error' }, { status: 500 });
  }
}
