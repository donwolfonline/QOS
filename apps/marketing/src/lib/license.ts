import crypto from 'crypto';

export interface LicensePayload {
  nodeId: string;
  moduleHash: string;
  expiresAt: string | null;
  issuedAt: string;
}

export function generateLicensePayload(nodeId: string, moduleHash: string, expiresAt: string | null = null): LicensePayload {
  return {
    nodeId,
    moduleHash,
    expiresAt,
    issuedAt: new Date().toISOString(),
  };
}

export function signLicense(payload: LicensePayload, privateKeyPem: string): string {
  const data = Buffer.from(JSON.stringify(payload));
  
  // Node's crypto.sign requires the first argument (algorithm) to be null for Ed25519 keys
  const signature = crypto.sign(null, data, privateKeyPem);
  
  const signedLicense = {
    ...payload,
    signature: signature.toString('base64')
  };
  
  // Return the base64 encoded string of the entire signed license JSON
  return Buffer.from(JSON.stringify(signedLicense)).toString('base64');
}
