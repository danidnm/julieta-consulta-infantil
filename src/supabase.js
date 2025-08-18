// Funciones de conexión y utilidades de Supabase compartidas en la app
import { createClient } from '@supabase/supabase-js';

// =============================
// Constantes de configuración
// =============================

// TEST
// export const SUPABASE_URL = 'https://slxoefzkhfpxpvgdcvjb.supabase.co'.trim();
// export const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNseG9lZnpraGZweHB2Z2RjdmpiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU0NDMyNjEsImV4cCI6MjA3MTAxOTI2MX0.VoZCqV9Cu7bcS-SDvkZLhsuBFIT1lsN2BPqUMPjY9Ow'.trim();
// export const TABLE_PATIENTS = 'patients';
// export const TABLE_REVIEWS = 'reviews';
// export const BUCKET_PHOTOS = 'photos';
// export const UPLOADER_EMAIL = 'danidnm@gmail.com';
// export const UPLOADER_PASSWORD = 'kY6LvCnfK8gt*Zi';

// PROD
export const SUPABASE_URL = 'https://hvnyypcoeulvfxhihfhh.supabase.co'.trim();
export const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh2bnl5cGNvZXVsdmZ4aGloZmhoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU0NDY0MDAsImV4cCI6MjA3MTAyMjQwMH0.y-buyOqOeTAA1YfpcEjiYvOS47FNC6ryYdFbolvzSPY'.trim();
export const TABLE_PATIENTS = 'patients';
export const TABLE_REVIEWS = 'reviews';
export const BUCKET_PHOTOS = 'photos';
export const UPLOADER_EMAIL = 'danidnm@gmail.com';
export const UPLOADER_PASSWORD = 'kY6LvCnfK8gt*Zi';


let _supabase = null;
let _cachedUrl = null;
let _cachedKey = null;

// Conservamos la API para compatibilidad, pero devolvemos las constantes
export function getSupabaseConfig() {
  const url = SUPABASE_URL.replace(/\/$/, '');
  const key = SUPABASE_ANON_KEY;
  const patientsTable = TABLE_PATIENTS;
  const reviewsTable = TABLE_REVIEWS;
  const photosBucket = BUCKET_PHOTOS;
  return { url, key, patientsTable, reviewsTable, photosBucket };
}

export function getSupabaseClient() {
  const { url, key } = getSupabaseConfig();
  if (!url || !key) return null;
  if (!_supabase || _cachedUrl !== url || _cachedKey !== key) {
    _supabase = createClient(url, key, {
      auth: {
        // Persist session in localStorage automáticamente; el SDK lo usará para Authorization
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
    throw new Error('Supabase no está configurado. Define SUPABASE_URL y SUPABASE_ANON_KEY en src/supabase.js');
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

// Asegura que existe una sesión de Auth (anon si no hay otra)
export async function ensureAuthSession() {
  const client = getSupabaseClient();
  if (!client) {
    throw new Error('Supabase no está configurado. Define SUPABASE_URL y SUPABASE_ANON_KEY en src/supabase.js');
  }
  const { data: { session } } = await client.auth.getSession();
  if (session) return session;
  // Iniciar sesión con el usuario uploader
  const { data, error } = await client.auth.signInWithPassword({
      email: UPLOADER_EMAIL,
      password: UPLOADER_PASSWORD,
  });
  if (error) {
    throw new Error('No se pudo iniciar una sesión (Auth). Verifica las credenciales UPLOADER_* o habilita Auth.');
  }
  return data?.session || null;
}

// Subir un archivo al bucket de Storage usando el SDK y devolver la URL pública
export async function sbUploadToBucket(bucket, path, fileOrBlob, contentType) {
  const client = getSupabaseClient();
  if (!client) {
    throw new Error('Supabase no está configurado. Define SUPABASE_URL y SUPABASE_ANON_KEY en src/supabase.js');
  }

  // Asegurar sesión para pasar RLS (las policies suelen requerir usuarios autenticados)
  try {
    await ensureAuthSession();
  } catch (e) {
    // Si no hay sesión, la subida probablemente fallará por RLS; devolvemos un error claro
    throw new Error(e?.message || 'No hay sesión de Supabase Auth. Inicia sesión para subir archivos.');
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
