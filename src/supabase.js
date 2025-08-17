// Funciones de conexión y utilidades de Supabase compartidas en la app

export function getSupabaseConfig() {
  const url = (localStorage.getItem('supabase.url') || '').trim().replace(/\/$/, '');
  const key = (localStorage.getItem('supabase.key') || '').trim();
  const patientsTable = (localStorage.getItem('supabase.patientsTable') || 'patients').trim();
  const reviewsTable = (localStorage.getItem('supabase.reviewsTable') || 'reviews').trim();
  return { url, key, patientsTable, reviewsTable };
}

export function hasSupabase() {
  const { url, key } = getSupabaseConfig();
  return Boolean(url && key);
}

export async function sbFetch(path, options = {}) {
  const { url, key } = getSupabaseConfig();
  if (!url || !key) {
    throw new Error('Supabase no está configurado. Ve a Ajustes y configura supabase.url y supabase.key');
  }
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
  // Algunos inserts pueden no devolver body; intentar json si existe
  const ct = res.headers.get('content-type') || '';
  if (ct.includes('application/json')) return await res.json();
  return null;
}
