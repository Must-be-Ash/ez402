/**
 * Encryption Service
 *
 * AES-256-GCM encryption for API key storage
 * Based on PRD Section 9.1
 */

import crypto from 'crypto';

export class EncryptionService {
  private readonly algorithm = 'aes-256-gcm';
  private readonly keyLength = 32; // 256 bits
  private readonly ivLength = 16;  // 128 bits
  private readonly authTagLength = 16; // 128 bits
  private readonly key: Buffer;

  constructor() {
    const keyHex = process.env.ENCRYPTION_KEY;

    if (!keyHex) {
      throw new Error('ENCRYPTION_KEY environment variable is required');
    }

    if (keyHex.length !== 64) { // 32 bytes = 64 hex characters
      throw new Error('ENCRYPTION_KEY must be 64 hex characters (32 bytes)');
    }

    this.key = Buffer.from(keyHex, 'hex');
  }

  /**
   * Encrypt plaintext using AES-256-GCM
   *
   * @param plaintext - The text to encrypt (e.g., API key)
   * @returns Encrypted string in format: iv:authTag:ciphertext (all in hex)
   *
   * @example
   * const service = new EncryptionService();
   * const encrypted = service.encrypt('my-secret-api-key');
   * // Returns: "a1b2c3...:d4e5f6...:789abc..."
   */
  encrypt(plaintext: string): string {
    // Generate random IV (Initialization Vector)
    const iv = crypto.randomBytes(this.ivLength);

    // Create cipher
    const cipher = crypto.createCipheriv(this.algorithm, this.key, iv);

    // Encrypt
    let ciphertext = cipher.update(plaintext, 'utf8', 'hex');
    ciphertext += cipher.final('hex');

    // Get authentication tag (for data integrity)
    const authTag = cipher.getAuthTag();

    // Return: iv:authTag:ciphertext (all in hex)
    return `${iv.toString('hex')}:${authTag.toString('hex')}:${ciphertext}`;
  }

  /**
   * Decrypt ciphertext using AES-256-GCM
   *
   * @param encrypted - Encrypted string in format: iv:authTag:ciphertext
   * @returns Decrypted plaintext
   *
   * @throws Error if decryption fails (invalid key, corrupted data, etc.)
   *
   * @example
   * const service = new EncryptionService();
   * const decrypted = service.decrypt('a1b2c3...:d4e5f6...:789abc...');
   * // Returns: "my-secret-api-key"
   */
  decrypt(encrypted: string): string {
    try {
      // Parse encrypted string
      const parts = encrypted.split(':');
      if (parts.length !== 3) {
        throw new Error('Invalid encrypted string format');
      }

      const [ivHex, authTagHex, ciphertext] = parts;
      const iv = Buffer.from(ivHex, 'hex');
      const authTag = Buffer.from(authTagHex, 'hex');

      // Create decipher
      const decipher = crypto.createDecipheriv(this.algorithm, this.key, iv);
      decipher.setAuthTag(authTag);

      // Decrypt
      let plaintext = decipher.update(ciphertext, 'hex', 'utf8');
      plaintext += decipher.final('utf8');

      return plaintext;
    } catch (error) {
      throw new Error(
        `Decryption failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Verify that encryption/decryption is working correctly
   *
   * @returns true if test passes, throws error otherwise
   *
   * @example
   * const service = new EncryptionService();
   * service.verifyEncryption(); // Throws if encryption is not working
   */
  verifyEncryption(): boolean {
    const testString = 'test-encryption-verification-12345';
    const encrypted = this.encrypt(testString);
    const decrypted = this.decrypt(encrypted);

    if (decrypted !== testString) {
      throw new Error('Encryption verification failed: decrypted text does not match original');
    }

    return true;
  }
}

/**
 * Generate a random 256-bit encryption key
 *
 * Use this once to generate ENCRYPTION_KEY for .env
 *
 * @returns 64-character hex string (32 bytes)
 *
 * @example
 * const key = generateEncryptionKey();
 * console.log(key); // "a1b2c3d4e5f6..."
 * // Add to .env.local:
 * // ENCRYPTION_KEY=a1b2c3d4e5f6...
 */
export function generateEncryptionKey(): string {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Utility to test encryption from command line
 *
 * Usage:
 * node -e "const { EncryptionService } = require('./lib/services/encryption'); const s = new EncryptionService(); console.log(s.encrypt('test'))"
 */
if (require.main === module) {
  console.log('Encryption Service Test\n');

  try {
    const service = new EncryptionService();
    const testString = 'my-secret-api-key-12345';

    console.log('Original:', testString);

    const encrypted = service.encrypt(testString);
    console.log('Encrypted:', encrypted);

    const decrypted = service.decrypt(encrypted);
    console.log('Decrypted:', decrypted);

    console.log('\n✅ Encryption test passed!');
  } catch (error) {
    console.error('\n❌ Encryption test failed:', error);
    process.exit(1);
  }
}
