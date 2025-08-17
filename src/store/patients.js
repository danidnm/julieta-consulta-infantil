// Gestión de pacientes usando Supabase
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
