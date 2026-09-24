export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { verifyRegistrationResponse } from '@simplewebauthn/server';
import { prisma } from '@/lib/prisma';
import { rpName } from '@/lib/webauthn-config';
import { createSession } from '@/lib/auth-utils';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { credential, userId } = body;
    if (!credential || !userId) {
      return NextResponse.json({ error: 'Datos faltantes' }, { status: 400 });
    }

    const rpID = process.env.NEXTAUTH_URL ? new URL(process.env.NEXTAUTH_URL).hostname : 'localhost';
    const origin = process.env.NEXTAUTH_URL ?? 'http://localhost:3000';

    // Find latest challenge
    const challengeRecord = await prisma.authChallenge.findFirst({
      where: { userId, expiresAt: { gt: new Date() } },
      orderBy: { createdAt: 'desc' },
    });

    if (!challengeRecord) {
      return NextResponse.json({ error: 'Challenge expirado' }, { status: 400 });
    }

    const verification = await verifyRegistrationResponse({
      response: credential,
      expectedChallenge: challengeRecord.challenge,
      expectedOrigin: origin,
      expectedRPID: rpID,
    });

    if (!verification.verified || !verification.registrationInfo) {
      return NextResponse.json({ error: 'Verificación fallida' }, { status: 400 });
    }

    const { credential: regCred, credentialDeviceType, credentialBackedUp } = verification.registrationInfo;

    // Save credential
    await prisma.webAuthnCredential.create({
      data: {
        credentialId: regCred.id,
        credentialPublicKey: Buffer.from(regCred.publicKey),
        counter: BigInt(regCred.counter),
        transports: credential.response?.transports ?? [],
        userId,
      },
    });

    // Clean up challenge
    await prisma.authChallenge.deleteMany({ where: { userId } });

    // Create session
    const user = await prisma.user.findUnique({ where: { id: userId } });
    await createSession({ id: userId, name: user?.name ?? 'Usuario' });

    return NextResponse.json({ verified: true });
  } catch (error: any) {
    console.error('Register verify error:', error);
    return NextResponse.json({ error: error?.message ?? 'Error de verificación' }, { status: 500 });
  }
}
