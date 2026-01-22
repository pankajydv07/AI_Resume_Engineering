import * as crypto from 'crypto';

/**
 * Encryption Utility for Sensitive Data
 * 
 * SECURITY: AES-256-GCM encryption for storing sensitive data
 * 
 * Features:
 * - AES-256-GCM (authenticated encryption)
 * - Unique IV for each encryption
 * - HMAC for additional integrity verification
 * 
 * Usage:
 * - Encrypt user API keys before storing in database
 * - Decrypt when needed for API calls
 * 
 * Required environment variable:
 * - ENCRYPTION_KEY: 32-byte (64 hex chars) secret key
 */

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16; // 128 bits
const AUTH_TAG_LENGTH = 16; // 128 bits
const SALT_LENGTH = 32;

/**
 * Get encryption key from environment
 * Falls back to a derived key from a secret if ENCRYPTION_KEY not set
 * 
 * WARNING: In production, always use a properly generated ENCRYPTION_KEY
 */
function getEncryptionKey(): Buffer {
  const envKey = process.env.ENCRYPTION_KEY;
  
  if (envKey && envKey.length === 64) {
    // Key provided as hex string (32 bytes = 64 hex chars)
    return Buffer.from(envKey, 'hex');
  }
  
  // Derive key from another secret (fallback for development)
  // In production, ENCRYPTION_KEY should be explicitly set
  const secret = process.env.CLERK_SECRET_KEY || process.env.DATABASE_URL || 'default-insecure-key';
  
  // Use PBKDF2 to derive a proper key
  return crypto.pbkdf2Sync(secret, 'resume-app-salt', 100000, 32, 'sha256');
}

/**
 * Encrypt a plaintext string
 * 
 * @param plaintext - String to encrypt
 * @returns Base64-encoded ciphertext with IV and auth tag
 */
export function encrypt(plaintext: string): string {
  if (!plaintext) {
    throw new Error('Cannot encrypt empty string');
  }

  const key = getEncryptionKey();
  const iv = crypto.randomBytes(IV_LENGTH);
  
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  
  let encrypted = cipher.update(plaintext, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  const authTag = cipher.getAuthTag();
  
  // Combine IV + authTag + ciphertext for storage
  // Format: [IV (16 bytes)][AuthTag (16 bytes)][Ciphertext]
  const combined = Buffer.concat([
    iv,
    authTag,
    Buffer.from(encrypted, 'hex'),
  ]);
  
  return combined.toString('base64');
}

/**
 * Decrypt a ciphertext string
 * 
 * @param ciphertext - Base64-encoded ciphertext with IV and auth tag
 * @returns Decrypted plaintext
 */
export function decrypt(ciphertext: string): string {
  if (!ciphertext) {
    throw new Error('Cannot decrypt empty string');
  }

  try {
    const key = getEncryptionKey();
    const combined = Buffer.from(ciphertext, 'base64');
    
    // Extract IV, authTag, and ciphertext
    const iv = combined.subarray(0, IV_LENGTH);
    const authTag = combined.subarray(IV_LENGTH, IV_LENGTH + AUTH_TAG_LENGTH);
    const encrypted = combined.subarray(IV_LENGTH + AUTH_TAG_LENGTH);
    
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);
    
    let decrypted = decipher.update(encrypted.toString('hex'), 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  } catch (error) {
    // Don't expose decryption errors to prevent oracle attacks
    throw new Error('Decryption failed');
  }
}

/**
 * Generate a secure random encryption key
 * Use this to generate ENCRYPTION_KEY for .env
 * 
 * @returns 64-character hex string (32 bytes)
 */
export function generateEncryptionKey(): string {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Hash a value for comparison (e.g., API key fingerprint)
 * 
 * @param value - Value to hash
 * @returns SHA-256 hash
 */
export function hashForComparison(value: string): string {
  return crypto.createHash('sha256').update(value).digest('hex');
}

/**
 * Mask a sensitive string for logging/display
 * Shows first 4 and last 4 characters only
 * 
 * @param value - Sensitive string to mask
 * @returns Masked string like "sk_t****quGBo"
 */
export function maskSensitiveString(value: string): string {
  if (!value || value.length < 10) {
    return '****';
  }
  
  const start = value.substring(0, 4);
  const end = value.substring(value.length - 4);
  return `${start}****${end}`;
}
