import crypto from 'crypto';

// Use a fixed key for sandbox development persistence
const ENCRYPTION_KEY = Buffer.from('f36e4fbc9581907da65b821415dfcd6291a82f342110cbe28fb4f1a6fef95bdf', 'hex'); // 32 bytes
const IV_LENGTH = 16; // For AES

export function encryptPassword(text: string): string {
  if (!text) return '';
  try {
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv('aes-256-cbc', ENCRYPTION_KEY, iv);
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return `${iv.toString('hex')}:${encrypted}`;
  } catch (err) {
    console.error('Encryption failed:', err);
    return '';
  }
}

export function decryptPassword(encryptedText: string): string {
  if (!encryptedText || !encryptedText.includes(':')) return '';
  try {
    const parts = encryptedText.split(':');
    const iv = Buffer.from(parts.shift() || '', 'hex');
    const encryptedTextBuffer = Buffer.from(parts.join(':'), 'hex');
    const decipher = crypto.createDecipheriv('aes-256-cbc', ENCRYPTION_KEY, iv);
    let decrypted = decipher.update(encryptedTextBuffer, undefined, 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  } catch (err) {
    console.error('Decryption failed:', err);
    return '[Decryption Error]';
  }
}
