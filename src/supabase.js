// Funciones de conexión y utilidades de Supabase compartidas en la app
import { createClient } from '@supabase/supabase-js';

let _supabase = null;
let _cachedUrl = null;
let _cachedKey = null;

export function getSupabaseConfig() {
  const url = (localStorage.getItem('supabase.url') || '').trim().replace(/\/$/, '');
  const key = (localStorage.getItem('supabase.key') || '').trim();
  const patientsTable = (localStorage.getItem('supabase.patientsTable') || 'patients').trim();
  const reviewsTable = (localStorage.getItem('supabase.reviewsTable') || 'reviews').trim();
  const photosBucket = (localStorage.getItem('supabase.photosBucket') || 'patient-photos').trim();
  return { url, key, patientsTable, reviewsTable, photosBucket };
}

export function hasSupabase() {
  const { url, key } = getSupabaseConfig();
  return Boolean(url && key);
}

export function getSupabaseClient() {
  const { url, key } = getSupabaseConfig();
  if (!url || !key) return null;
  if (!_supabase || _cachedUrl !== url || _cachedKey !== key) {
    _supabase = createClient(url, key, {
      auth: {
        // Persist session in localStorage automatically; SDK will use it for Authorization
        persistSession: true,
        autoRefreshToken: true,
      }
    });
    _cachedUrl = url;
    _cachedKey = key;
  }
  return _supabase;
}

export async function sbFetch(path, options = {}) {
  const { url, key } = getSupabaseConfig();
  if (!url || !key) {
    throw new Error('Supabase no está configurado. Ve a Ajustes y configura supabase.url y supabase.key');
  }
  // Conservamos la implementación actual para no romper llamadas existentes.
  // Nota: Para operaciones protegidas por RLS, usa el SDK y sesiones de usuario.
  const headers = {
    'Content-Type': 'application/json',
    'apikey': key,
    'Authorization': `Bearer ${key}`,
    ...(options.headers || {})
  };
  const res = await fetch(`${url}${path}`, { ...options, headers });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Supabase error ${res.status} ${res.statusText}: ${text}`);
  }
  const ct = res.headers.get('content-type') || '';
  if (ct.includes('application/json')) return await res.json();
  return null;
}

// Subir un archivo al bucket de Storage usando el SDK y devolver la URL pública
export async function sbUploadToBucket(bucket, path, fileOrBlob, contentType) {
  const client = getSupabaseClient();
  if (!client) {
    throw new Error('Supabase no está configurado. Ve a Ajustes y configura supabase.url y supabase.key');
  }
  const { error } = await client
    .storage
    .from(bucket)
    .upload(path, fileOrBlob, { upsert: true, contentType: contentType || undefined });

  if (error) {
    // error.message suele contener detalles de RLS si aplica
    throw new Error(`Supabase Storage upload error: ${error.message || 'desconocido'}`);
  }

  const { data: pub } = client.storage.from(bucket).getPublicUrl(path);
  return pub?.publicUrl || null;
}
