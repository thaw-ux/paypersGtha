export const AUTH_USERNAME = process.env.AUTH_USERNAME || '498558';
export const AUTH_PASSWORD = process.env.AUTH_PASSWORD || 'Pj#0818107430';
export const SESSION_COOKIE_NAME = 'paypers_session';
export const AUTH_SECRET = process.env.AUTH_SECRET || 'paypers-auth-secret-key-2026-secure-token';

const encoder = new TextEncoder();

async function getCryptoKey(): Promise<CryptoKey> {
  return await crypto.subtle.importKey(
    'raw',
    encoder.encode(AUTH_SECRET),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify']
  );
}

function base64UrlEncode(str: string): string {
  if (typeof Buffer !== 'undefined') {
    return Buffer.from(str, 'utf-8').toString('base64url');
  }
  return btoa(str).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function base64UrlDecode(str: string): string {
  if (typeof Buffer !== 'undefined') {
    return Buffer.from(str, 'base64url').toString('utf-8');
  }
  let base64 = str.replace(/-/g, '+').replace(/_/g, '/');
  while (base64.length % 4) {
    base64 += '=';
  }
  return atob(base64);
}

function base64UrlToArrayBuffer(base64Url: string): Uint8Array {
  let base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
  while (base64.length % 4) {
    base64 += '=';
  }
  const binaryString = typeof Buffer !== 'undefined' 
    ? Buffer.from(base64Url, 'base64url').toString('binary')
    : atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

function arrayBufferToBase64Url(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

export interface SessionPayload {
  user: string;
  role: string;
  name: string;
  exp: number;
}

/**
 * Generate signed session token valid for 30 days
 */
export async function createSessionToken(username: string): Promise<string> {
  const key = await getCryptoKey();
  const payload: SessionPayload = {
    user: username,
    role: 'admin',
    name: `ผู้ดูแลระบบ (${username})`,
    exp: Date.now() + 30 * 24 * 60 * 60 * 1000, // 30 days
  };

  const payloadB64 = base64UrlEncode(JSON.stringify(payload));
  const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(payloadB64));
  const signatureB64 = arrayBufferToBase64Url(signature);

  return `${payloadB64}.${signatureB64}`;
}

/**
 * Verify signed session token and return payload if valid
 */
export async function verifySessionToken(token: string | undefined | null): Promise<SessionPayload | null> {
  if (!token) return null;

  try {
    const parts = token.split('.');
    if (parts.length !== 2) return null;

    const [payloadB64, signatureB64] = parts;
    const key = await getCryptoKey();
    const signatureBytes = base64UrlToArrayBuffer(signatureB64);

    const isValid = await crypto.subtle.verify(
      'HMAC',
      key,
      signatureBytes as unknown as BufferSource,
      encoder.encode(payloadB64)
    );

    if (!isValid) return null;

    const payload: SessionPayload = JSON.parse(base64UrlDecode(payloadB64));
    if (Date.now() > payload.exp) {
      return null; // Expired
    }

    return payload;
  } catch (error) {
    console.error('Session verification error:', error);
    return null;
  }
}
