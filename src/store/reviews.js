// Gestión de revisiones (reviews) usando Supabase
import { getSupabaseConfig, sbFetch } from '../supabase.js';

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

export async function getReviews(patientId) {
  const { reviewsTable } = getSupabaseConfig();
  const data = await sbFetch(`/rest/v1/${encodeURIComponent(reviewsTable)}?patient_id=eq.${encodeURIComponent(patientId)}&select=*&order=created_at.desc.nullslast`);
  return (Array.isArray(data) ? data : []).map(mapReviewFromDb);
}

export async function saveReview(patientId, review) {
  const { reviewsTable } = getSupabaseConfig();
  const body = mapReviewToDb(patientId, review, { includeId: true, includePatientId: true });
  await sbFetch(`/rest/v1/${encodeURIComponent(reviewsTable)}?on_conflict=id`, {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'Prefer': 'resolution=merge-duplicates' }
  });
}
