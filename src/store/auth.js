// Simple client-side auth store using localStorage
// Password is "0345"; to avoid storing it in plain text, we use SHA-256 hash comparison when available.

const STORAGE_KEY = 'auth_identified';
const HASHED_PASSWORD = '838c38dbeff87f31a28df4361ea6411792a5bfff74ff4efa968022e487d7ac30';

function toHex(buffer) {
  return Array.from(new Uint8Array(buffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

async function sha256(text) {
  if (window.crypto?.subtle) {
    const enc = new TextEncoder();
    const digest = await window.crypto.subtle.digest('SHA-256', enc.encode(text));
    return toHex(digest);
  }
  return '';
}

export function isAuthenticated() {
  try {
    return localStorage.getItem(STORAGE_KEY) === '1';
  } catch {
    return false;
  }
}

export async function login(password) {
  const inputHash = await sha256(password || '');
  const ok = (inputHash === HASHED_PASSWORD);
  if (ok) {
    try { localStorage.setItem(STORAGE_KEY, '1'); } catch {}
    return true;
  }
  return false;
}

export function logout() {
  try { localStorage.removeItem(STORAGE_KEY); } catch {}
}
