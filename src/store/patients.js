// Gestión de pacientes y revisiones usando Supabase
import { getSupabaseConfig, sbFetch } from '../supabase.js';

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

function mapReviewFromDb(row) {
    return {
        id: row.id,
        date: row.date || '',
        temperature: row.temperature ?? '',
        symptoms: row.symptoms ?? '',
        tests: normalizeTestsToString(row.tests),
        result: row.result ?? '',
        position: row.position ?? null
    };
}

function mapReviewToDb(patientId, review, { includeId = true, includePatientId = true } = {}) {
    const body = {
        date: review.date ?? null,
        temperature: review.temperature ?? null,
        symptoms: review.symptoms ?? null,
        tests: normalizeTestsToArray(review.tests),
        result: review.result ?? null,
        position: review.position ?? null
    };
    if (includePatientId) body.patient_id = patientId;
    if (includeId) body.id = review.id || (typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : undefined);
    return body;
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
  const { patientsTable } = getSupabaseConfig();
  const data = await sbFetch(`/rest/v1/${encodeURIComponent(patientsTable)}?select=*`);
  // Sort by patient name (case/locale-insensitive) for consistent display on the page
  return Array.isArray(data)
    ? data
        .map(mapPatientFromDb)
        .sort((a, b) => (a.name || '').localeCompare(b.name || '', undefined, { sensitivity: 'base' }))
    : [];
}

export async function getPatientById(id) {
    const { patientsTable } = getSupabaseConfig();
    const data = await sbFetch(`/rest/v1/${encodeURIComponent(patientsTable)}?id=eq.${encodeURIComponent(id)}&select=*&limit=1`);
    return Array.isArray(data) && data[0] ? mapPatientFromDb(data[0]) : null;
}

export async function savePatients(patients) {
  const { patientsTable } = getSupabaseConfig();
  const payload = (Array.isArray(patients) ? patients : [patients]).map(mapPatientToDb).filter(r => r.id);
  if (!payload.length) return;
  await sbFetch(`/rest/v1/${encodeURIComponent(patientsTable)}?on_conflict=id`, {
    method: 'POST',
    body: JSON.stringify(payload),
    headers: { 'Prefer': 'resolution=merge-duplicates' }
  });
}

export async function getReviews(patientId) {
  const { reviewsTable } = getSupabaseConfig();
  const data = await sbFetch(`/rest/v1/${encodeURIComponent(reviewsTable)}?patient_id=eq.${encodeURIComponent(patientId)}&select=*&order=created_at.desc.nullslast`);
  return (Array.isArray(data) ? data : []).map(mapReviewFromDb);
}

export async function saveReview(patientId, review) {
  const { reviewsTable } = getSupabaseConfig();
  const body = mapReviewToDb(patientId, review, { includeId: true, includePatientId: true });
  await sbFetch(`/rest/v1/${encodeURIComponent(reviewsTable)}`, {
    method: 'POST',
    body: JSON.stringify(body)
  });
}

export async function updateReview(patientId, indexOrId, review) {
  // Permitir actualizar por índice o por id directo
  const list = await getReviews(patientId);
  if (!Array.isArray(list) || list.length === 0) return;
  let target = null;
  if (typeof indexOrId === 'number' && Number.isFinite(indexOrId)) {
    if (indexOrId < 0 || indexOrId >= list.length) return;
    target = list[indexOrId];
  } else if (typeof indexOrId === 'string' && indexOrId) {
    target = list.find(r => r.id === indexOrId) || null;
  }
  if (!target || !target.id) return;
  const { reviewsTable } = getSupabaseConfig();
  const body = mapReviewToDb(patientId, review, { includeId: false, includePatientId: false });
  await sbFetch(`/rest/v1/${encodeURIComponent(reviewsTable)}?id=eq.${encodeURIComponent(target.id)}`, {
    method: 'PATCH',
    body: JSON.stringify(body),
    headers: { 'Prefer': 'return=minimal' }
  });
}
