export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { generateRegistrationOptions } from '@simplewebauthn/server';
import { prisma } from '@/lib/prisma';
import { rpName } from '@/lib/webauthn-config';

export async function POST() {
  try {
    const rpID = process.env.NEXTAUTH_URL ? new URL(process.env.NEXTAUTH_URL).hostname : 'localhost';

    // Find or create the single user
    let user = await prisma.user.findFirst();
    if (!user) {
      user = await prisma.user.create({ data: { name: 'Usuario' } });
    }

    // Get existing credentials
    const existingCreds = await prisma.webAuthnCredential.findMany({
      where: { userId: user.id },
    });

    const options = await generateRegistrationOptions({
      rpName,
      rpID,
      userID: new TextEncoder().encode(user.id),
      userName: user.name,
      attestationType: 'none',
      excludeCredentials: existingCreds.map((c: any) => ({
        id: c.credentialId,
        transports: c.transports as any[],
      })),
      authenticatorSelection: {
        authenticatorAttachment: 'platform',
        userVerification: 'required',
        residentKey: 'preferred',
      },
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
    console.error('Register options error:', error);
    return NextResponse.json({ error: error?.message ?? 'Error generando opciones' }, { status: 500 });
  }
}
