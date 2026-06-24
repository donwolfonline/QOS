const SECRET = new TextEncoder().encode(
  process.env.QOS_ADMIN_SECRET || 'qos-super-secret-dev-key-32-chars!'
);

/**
 * Creates a generic JWT-like signed token using Web Crypto API.
 */
export async function signAdminToken(payload: Record<string, unknown>): Promise<string> {
  const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).replace(/=+$/, '');
  const data = btoa(JSON.stringify(payload)).replace(/=+$/, '');
  const content = `${header}.${data}`;

  const key = await crypto.subtle.importKey(
    'raw',
    SECRET,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const signatureBuffer = await crypto.subtle.sign(
    'HMAC',
    key,
    new TextEncoder().encode(content)
  );

  // Convert buffer to base64url
  const signatureArray = Array.from(new Uint8Array(signatureBuffer));
  const signature = btoa(String.fromCharCode(...signatureArray))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');

  return `${content}.${signature}`;
}

/**
 * Verifies the signature of the token. Returns the payload if valid, null otherwise.
 */
export async function verifyAdminToken(token: string): Promise<Record<string, unknown> | null> {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;

    const [header, data, signature] = parts;
    const content = `${header}.${data}`;

    const key = await crypto.subtle.importKey(
      'raw',
      SECRET,
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['verify']
    );

    // Convert signature back to Uint8Array
    const sigBase64 = signature.replace(/-/g, '+').replace(/_/g, '/');
    const sigString = atob(sigBase64);
    const sigBuffer = new Uint8Array(sigString.length);
    for (let i = 0; i < sigString.length; i++) {
      sigBuffer[i] = sigString.charCodeAt(i);
    }

    const isValid = await crypto.subtle.verify(
      'HMAC',
      key,
      sigBuffer,
      new TextEncoder().encode(content)
    );

    if (!isValid) return null;

    const payloadString = atob(data);
    return JSON.parse(payloadString);
  } catch {
    return null;
  }
}
