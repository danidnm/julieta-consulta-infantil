// Gestión de pacientes y revisiones usando únicamente Supabase (sin fallback a Local Storage)
export const PATIENTS_KEY = 'patients';
export const REVIEWS_KEY = 'reviews';

function getSupabaseConfig() {
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

async function sbFetch(path, options = {}) {
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
  // Some inserts may prefer not to return body; try json if any
  const ct = res.headers.get('content-type') || '';
  if (ct.includes('application/json')) return await res.json();
  return null;
}

function mapPatientFromDb(row) {
  // Mapear columnas de supabase -> forma usada en la app
  return {
    id: row.id,
    name: row.name || '',
    gender: row.gender || '',
    birthdate: row.birthdate || '',
    photo: row.photo_url || ''
  };
}

function mapPatientToDb(p) {
  return {
    id: p.id,
    name: p.name || null,
    gender: p.gender || null,
    birthdate: p.birthdate || null,
    photo_url: p.photo || null
  };
}

function normalizeTestsToArray(tests) {
  if (tests == null) return null;
  if (Array.isArray(tests)) return tests.map(x => String(x).trim()).filter(Boolean);
  // if it is a string like 'a, b'
  const s = String(tests).trim();
  if (!s) return null;
  try {
    const parsed = JSON.parse(s);
    if (Array.isArray(parsed)) return parsed.map(x => String(x).trim()).filter(Boolean);
  } catch(_) {}
  return s.split(',').map(x => x.trim()).filter(Boolean);
}

function normalizeTestsToString(tests) {
  if (tests == null) return '';
  if (Array.isArray(tests)) return tests.map(x => String(x)).filter(Boolean).join(', ');
  return String(tests);
}

export async function getPatients() {
  if (!hasSupabase()) {
    throw new Error('Supabase no está configurado. Ve a Ajustes y configura supabase.url y supabase.key');
  }
  const { patientsTable } = getSupabaseConfig();
  const data = await sbFetch(`/rest/v1/${encodeURIComponent(patientsTable)}?select=*`);
  return Array.isArray(data) ? data.map(mapPatientFromDb) : [];
}

export async function savePatients(patients) {
  if (!hasSupabase()) {
    throw new Error('Supabase no está configurado. Ve a Ajustes y configura supabase.url y supabase.key');
  }
  const { patientsTable } = getSupabaseConfig();
  const payload = (Array.isArray(patients) ? patients : [patients]).map(mapPatientToDb).filter(r => r.id);
  if (!payload.length) return;
  await sbFetch(`/rest/v1/${encodeURIComponent(patientsTable)}?on_conflict=id`, {
    method: 'POST',
    body: JSON.stringify(payload),
    headers: { 'Prefer': 'resolution=merge-duplicates' }
  });
}

export async function getPatientById(id) {
  if (!hasSupabase()) {
    throw new Error('Supabase no está configurado. Ve a Ajustes y configura supabase.url y supabase.key');
  }
  const { patientsTable } = getSupabaseConfig();
  const data = await sbFetch(`/rest/v1/${encodeURIComponent(patientsTable)}?id=eq.${encodeURIComponent(id)}&select=*&limit=1`);
  return Array.isArray(data) && data[0] ? mapPatientFromDb(data[0]) : null;
}

export async function getReviews(patientId) {
  if (!hasSupabase()) {
    throw new Error('Supabase no está configurado. Ve a Ajustes y configura supabase.url y supabase.key');
  }
  const { reviewsTable } = getSupabaseConfig();
  const data = await sbFetch(`/rest/v1/${encodeURIComponent(reviewsTable)}?patient_id=eq.${encodeURIComponent(patientId)}&select=*&order=date.asc`);
  return (Array.isArray(data) ? data : []).map(r => ({
    id: r.id,
    date: r.date || '',
    temperature: r.temperature ?? '',
    symptoms: r.symptoms ?? '',
    tests: normalizeTestsToString(r.tests),
    result: r.result ?? '',
    position: r.position ?? null
  }));
}

export async function saveReview(patientId, review) {
  if (!hasSupabase()) {
    throw new Error('Supabase no está configurado. Ve a Ajustes y configura supabase.url y supabase.key');
  }
  const { reviewsTable } = getSupabaseConfig();
  const body = {
    id: review.id || (typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : undefined),
    patient_id: patientId,
    date: review.date ?? null,
    temperature: review.temperature ?? null,
    symptoms: review.symptoms ?? null,
    tests: normalizeTestsToArray(review.tests),
    result: review.result ?? null,
    position: review.position ?? null
  };
  await sbFetch(`/rest/v1/${encodeURIComponent(reviewsTable)}`, {
    method: 'POST',
    body: JSON.stringify(body)
  });
}

export async function updateReview(patientId, index, review) {
  if (!hasSupabase()) {
    throw new Error('Supabase no está configurado. Ve a Ajustes y configura supabase.url y supabase.key');
  }
  // Buscar la revisión por índice para obtener su id, luego hacer update por id
  const list = await getReviews(patientId);
  if (!Array.isArray(list) || index < 0 || index >= list.length) return;
  const target = list[index];
  if (!target || !target.id) return;
  const { reviewsTable } = getSupabaseConfig();
  const body = {
    // id no se actualiza
    date: review.date ?? null,
    temperature: review.temperature ?? null,
    symptoms: review.symptoms ?? null,
    tests: normalizeTestsToArray(review.tests),
    result: review.result ?? null,
    position: review.position ?? null
  };
  await sbFetch(`/rest/v1/${encodeURIComponent(reviewsTable)}?id=eq.${encodeURIComponent(target.id)}`, {
    method: 'PATCH',
    body: JSON.stringify(body),
    headers: { 'Prefer': 'return=minimal' }
  });
}
