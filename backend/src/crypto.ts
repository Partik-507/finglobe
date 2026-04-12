import crypto from "crypto";

// ── FINGLOBE Cryptographic Engine ────────────────────────────────────
// Paper Section IV.B — SHA-256 Fingerprinting + AES-256-GCM Encryption

const ENCRYPTION_KEY_HEX = process.env.ENCRYPTION_KEY || "";

/**
 * Derive a 32-byte key from the hex env variable or generate one.
 * In production, ENCRYPTION_KEY must be set to a 64-char hex string.
 */
function getEncryptionKey(): Buffer {
  if (ENCRYPTION_KEY_HEX && ENCRYPTION_KEY_HEX.length === 64) {
    return Buffer.from(ENCRYPTION_KEY_HEX, "hex");
  }
  // Fallback: deterministic key from a fixed passphrase (DEMO ONLY)
  console.warn(
    "⚠️  ENCRYPTION_KEY not set. Using derived key — set in .env for production!"
  );
  return crypto.scryptSync("finglobe-demo-key-2026", "finglobe-salt", 32);
}

export interface HashResult {
  hex: string;   // SHA-256 as hex string
  bytes32: string; // 0x-prefixed bytes32 for Solidity
}

export interface EncryptResult {
  iv: string;        // hex
  authTag: string;   // hex
  encrypted: string; // hex
  combined: string;  // iv + authTag + encrypted as single hex blob
}

/**
 * Compute SHA-256 hash of a buffer.
 * [Paper IV.B] — Document fingerprinting for tamper detection.
 */
export function hashFile(buffer: Buffer): HashResult {
  const hash = crypto.createHash("sha256").update(buffer).digest("hex");
  return {
    hex: hash,
    bytes32: "0x" + hash,
  };
}

/**
 * Encrypt a file buffer using AES-256-GCM.
 * Returns IV, auth tag, and ciphertext as hex strings.
 * [Paper IV.B] — Confidential storage before IPFS upload.
 */
export function encryptFile(buffer: Buffer): EncryptResult {
  const key = getEncryptionKey();
  const iv = crypto.randomBytes(12); // 96-bit IV for GCM
  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);

  const encrypted = Buffer.concat([cipher.update(buffer), cipher.final()]);
  const authTag = cipher.getAuthTag(); // 128-bit GCM auth tag

  // Combine as: [12 bytes IV] + [16 bytes authTag] + [ciphertext]
  const combined = Buffer.concat([iv, authTag, encrypted]);

  return {
    iv: iv.toString("hex"),
    authTag: authTag.toString("hex"),
    encrypted: encrypted.toString("hex"),
    combined: combined.toString("hex"),
  };
}

/**
 * Decrypt a file encrypted by encryptFile().
 */
export function decryptFile(combinedHex: string): Buffer {
  const combined = Buffer.from(combinedHex, "hex");
  const key = getEncryptionKey();

  const iv = combined.subarray(0, 12);
  const authTag = combined.subarray(12, 28);
  const encrypted = combined.subarray(28);

  const decipher = crypto.createDecipheriv("aes-256-gcm", key, iv);
  decipher.setAuthTag(authTag);

  return Buffer.concat([decipher.update(encrypted), decipher.final()]);
}

/**
 * Compute SHA-256 of a string (for metadata hashing).
 */
export function hashString(str: string): string {
  return "0x" + crypto.createHash("sha256").update(str, "utf8").digest("hex");
}

/**
 * Generate a cryptographically secure random 32-byte hex string.
 * Useful for API keys, session tokens, etc.
 */
export function generateSecret(): string {
  return crypto.randomBytes(32).toString("hex");
}
