// Gestión de revisiones (reviews) usando Supabase
import { getSupabaseConfig, sbFetch } from '../supabase.js';

function mapReviewFromDb(row) {
    return {
        id: row.id,
        date: row.date || '',
        patient_id: row.patient_id || '',
        temperature: row.temperature ?? '',
        symptoms: row.symptoms ?? '',
        tests: row.tests,
        result: row.result ?? '',
        position: row.position ?? null
    };
}

function mapReviewToDb(review) {
    return {
        id: review.id,
        date: review.date ?? null,
        patient_id: review.patient_id ?? null,
        temperature: review.temperature ?? null,
        symptoms: review.symptoms ?? null,
        tests: review.tests,
        result: review.result ?? null,
        position: review.position ?? null
    };
}

export async function getReviews(patientId) {
  const { reviewsTable } = getSupabaseConfig();
  const data = await sbFetch(`/rest/v1/${encodeURIComponent(reviewsTable)}?patient_id=eq.${encodeURIComponent(patientId)}&select=*&order=created_at.desc.nullslast`);
  return (Array.isArray(data) ? data : []).map(mapReviewFromDb);
}

export async function getReviewById(id) {
    const { reviewsTable } = getSupabaseConfig();
    const data = await sbFetch(`/rest/v1/${encodeURIComponent(reviewsTable)}?id=eq.${encodeURIComponent(id)}&select=*&limit=1`);
    return Array.isArray(data) && data[0] ? mapReviewFromDb(data[0]) : null;
}

export async function saveReview(review) {
  const { reviewsTable } = getSupabaseConfig();
  const body = mapReviewToDb(review, { includeId: true });
  await sbFetch(`/rest/v1/${encodeURIComponent(reviewsTable)}?on_conflict=id`, {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'Prefer': 'resolution=merge-duplicates' }
  });
}
