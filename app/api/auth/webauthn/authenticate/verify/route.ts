export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { verifyAuthenticationResponse } from '@simplewebauthn/server';
import { prisma } from '@/lib/prisma';
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

    const challengeRecord = await prisma.authChallenge.findFirst({
      where: { userId, expiresAt: { gt: new Date() } },
      orderBy: { createdAt: 'desc' },
    });

    if (!challengeRecord) {
      return NextResponse.json({ error: 'Challenge expirado' }, { status: 400 });
    }

    // Find stored credential
    const storedCred = await prisma.webAuthnCredential.findUnique({
      where: { credentialId: credential.id },
    });

    if (!storedCred) {
      return NextResponse.json({ error: 'Credencial no encontrada' }, { status: 400 });
    }

    const verification = await verifyAuthenticationResponse({
      response: credential,
      expectedChallenge: challengeRecord.challenge,
      expectedOrigin: origin,
      expectedRPID: rpID,
      credential: {
        id: storedCred.credentialId,
        publicKey: new Uint8Array(storedCred.credentialPublicKey),
        counter: Number(storedCred.counter),
        transports: storedCred.transports as any[],
      },
    });

    if (!verification.verified) {
      return NextResponse.json({ error: 'Verificación fallida' }, { status: 400 });
    }

    // Update counter
    await prisma.webAuthnCredential.update({
      where: { credentialId: credential.id },
      data: { counter: BigInt(verification.authenticationInfo.newCounter) },
    });

    // Clean up challenge
    await prisma.authChallenge.deleteMany({ where: { userId } });

    // Create session
    const user = await prisma.user.findUnique({ where: { id: userId } });
    await createSession({ id: userId, name: user?.name ?? 'Usuario' });

    return NextResponse.json({ verified: true });
  } catch (error: any) {
    console.error('Auth verify error:', error);
    return NextResponse.json({ error: error?.message ?? 'Error' }, { status: 500 });
  }
}
