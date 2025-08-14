// Gestión de pacientes y revisiones en Local Storage
export const PATIENTS_KEY = 'patients';
export const REVIEWS_KEY = 'reviews';

export function getPatients() {
  return JSON.parse(localStorage.getItem(PATIENTS_KEY) || '[]');
}

export function savePatients(patients) {
  localStorage.setItem(PATIENTS_KEY, JSON.stringify(patients));
}

export function getPatientById(id) {
  return getPatients().find(p => p.id === id);
}

export function getReviews(patientId) {
  const all = JSON.parse(localStorage.getItem(REVIEWS_KEY) || '{}');
  return all[patientId] || [];
}

export function saveReview(patientId, review) {
  const all = JSON.parse(localStorage.getItem(REVIEWS_KEY) || '{}');
  if (!all[patientId]) all[patientId] = [];
  all[patientId].push(review);
  localStorage.setItem(REVIEWS_KEY, JSON.stringify(all));
}
