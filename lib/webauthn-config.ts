export const rpName = 'FinTrack';

export function getRpID(): string {
  return process.env.NEXTAUTH_URL ? new URL(process.env.NEXTAUTH_URL).hostname : 'localhost';
}

export function getOrigin(): string {
  return process.env.NEXTAUTH_URL ?? 'http://localhost:3000';
}
