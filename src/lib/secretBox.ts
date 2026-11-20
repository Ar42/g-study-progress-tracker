/**
 * Encrypts small secrets (exam logins) before they go to the public sheet.
 * AES-GCM with a key derived (PBKDF2, 250k rounds) from a passphrase that only
 * lives on your devices. Stored format: "enc1:<salt>:<iv>:<ciphertext>" (base64).
 */
const PREFIX = "enc1";
const PASS_KEY = "exam-credentials-passphrase";

const enc = new TextEncoder();
const dec = new TextDecoder();
const b64 = (bytes: Uint8Array) => btoa(String.fromCharCode(...bytes));
const unb64 = (s: string) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0));

async function deriveKey(passphrase: string, salt: Uint8Array): Promise<CryptoKey> {
  const base = await crypto.subtle.importKey("raw", enc.encode(passphrase), "PBKDF2", false, ["deriveKey"]);
  return crypto.subtle.deriveKey(
    { name: "PBKDF2", salt: salt as BufferSource, iterations: 250_000, hash: "SHA-256" },
    base,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"],
  );
}

export const isEncrypted = (value: string) => value.startsWith(`${PREFIX}:`);

export async function encryptText(plain: string, passphrase: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await deriveKey(passphrase, salt);
  const cipher = new Uint8Array(await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, enc.encode(plain)));
  return [PREFIX, b64(salt), b64(iv), b64(cipher)].join(":");
}

/** Throws when the passphrase is wrong (or the value was tampered with). */
export async function decryptText(stored: string, passphrase: string): Promise<string> {
  const [prefix, salt, iv, cipher] = stored.split(":");
  if (prefix !== PREFIX || !salt || !iv || !cipher) throw new Error("Not an encrypted value");
  const key = await deriveKey(passphrase, unb64(salt));
  try {
    const plain = await crypto.subtle.decrypt({ name: "AES-GCM", iv: unb64(iv) as BufferSource }, key, unb64(cipher) as BufferSource);
    return dec.decode(plain);
  } catch {
    throw new Error("Wrong passphrase");
  }
}

export function getPassphrase(): string {
  try {
    return localStorage.getItem(PASS_KEY) ?? "";
  } catch {
    return "";
  }
}

export function setPassphrase(value: string): void {
  try {
    if (value) localStorage.setItem(PASS_KEY, value);
    else localStorage.removeItem(PASS_KEY);
  } catch {
    /* private mode: kept for this page only */
  }
}
