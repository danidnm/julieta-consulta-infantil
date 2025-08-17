import Alpine from 'alpinejs';
import { getPatients, savePatients, getPatientById } from './store/patients';
import { getReviews, saveReview, updateReview } from './store/reviews';
import { getSupabaseConfig, sbUploadToBucket } from './supabase.js';

window.Alpine = Alpine;

// SPA router simple
const routes = {
  Home: async () => {
    const html = await fetch('pages/Home.html').then(r => r.text());
    document.getElementById('app').innerHTML = html;
    // Cargar componente lista de pacientes
    const comp = await fetch('components/PatientList.html').then(r => r.text());
    document.getElementById('patients-list').innerHTML = comp;
    Alpine.data('patientList', () => ({
      patients: [],
      filteredPatients: [],
      search: '',
      error: '',
      async init() {
        try {
          this.patients = await getPatients();
          this.filteredPatients = this.patients;
        } catch (e) {
          this.error = e?.message || 'Error al cargar pacientes.';
          alert(this.error);
          this.patients = [];
          this.filteredPatients = [];
        }
      },
      filter() {
        this.filteredPatients = this.patients.filter(p => p.name.toLowerCase().includes(this.search.toLowerCase()));
      }
    }));
    Alpine.start();
  },
  PatientEdit: async (id) => {
    const html = await fetch('pages/PatientEdit.html').then(r => r.text());
    document.getElementById('app').innerHTML = html;
    // Cargar componente formulario paciente
    const comp = await fetch('components/PatientForm.html').then(r => r.text());
    document.getElementById('patient-form').innerHTML = comp;
    Alpine.data('patientForm', () => ({
      patient: { id: id || (crypto.randomUUID ? crypto.randomUUID() : String(Date.now())), name: '', gender: '', birthdate: '', photo: '' },
      reviews: [],
      error: '',
      async init() {
        // Cargar paciente y revisiones si el paciente ya existe
        if (id) {
          try {
            const p = await getPatientById(id);
            if (p) this.patient = { ...p };
            this.reviews = await getReviews(this.patient.id) || [];
          } catch (e) {
            this.error = e?.message || 'Error al cargar el paciente.';
            alert(this.error);
          }
        }
      },
      async uploadPhoto(e) {
        const file = e.target.files[0];
        if (!file) return;
        try {
          const { photosBucket } = getSupabaseConfig();
          // Extensión a partir del mime o nombre
          const mime = file.type || 'image/jpeg';
          const guessedExt = (file.name && file.name.includes('.')) ? file.name.split('.').pop() : '';
          const extFromMime = mime.split('/')[1] || 'jpg';
          const ext = (guessedExt || extFromMime || 'jpg').toLowerCase().replace(/[^a-z0-9]/g, '') || 'jpg';
          const path = `patients/${this.patient.id}/avatar-${Date.now()}.${ext}`;
          const publicUrl = await sbUploadToBucket(photosBucket, path, file, mime);
          this.patient.photo = publicUrl;
          // Opcional: guardar inmediatamente para persistir la URL de la foto
          await savePatients(this.patient);
        } catch (err) {
          console.error(err);
          alert(err?.message || 'No se pudo subir la foto a Supabase. Revisa la configuración en Ajustes.');
        }
      },
      async save() {
        try {
          await savePatients(this.patient);
          window.dispatchEvent(new CustomEvent('navigate', { detail: { page: 'Home' } }));
        } catch (e) {
          const msg = e?.message || 'Error al guardar el paciente.';
          alert(msg);
        }
      }
    }));
    Alpine.start();
  },
  ReviewEdit: async (id) => {
    const html = await fetch('pages/ReviewEdit.html').then(r => r.text());
    document.getElementById('app').innerHTML = html;
    // Cargar componente formulario revisión
    const comp = await fetch('components/ReviewForm.html').then(r => r.text());
    document.getElementById('review-form').innerHTML = comp;

    // id puede venir como "patientId" o "patientId:reviewKey" donde reviewKey puede ser índice o id
    const [patientId, reviewKeyRaw] = (id || '').split(':');
    const isIndex = reviewKeyRaw != null && reviewKeyRaw !== '' && /^\d+$/.test(reviewKeyRaw);
    const editKey = isIndex ? parseInt(reviewKeyRaw, 10) : (reviewKeyRaw || null);
    let reviews = [];
    let existing = null;
    if (editKey !== null) {
      try {
        reviews = await getReviews(patientId);
        existing = isIndex ? (reviews[editKey] || null) : (reviews.find(r => r.id === editKey) || null);
      } catch (e) {
        alert(e?.message || 'Error al cargar las revisiones.');
        reviews = [];
        existing = null;
      }
    }

    Alpine.data('reviewForm', () => ({
      review: existing ? {
        ...existing,
        // convertir tests string a array para checkboxes
        tests: (existing.tests ? String(existing.tests).split(',').map(s => s.trim()).filter(Boolean) : []),
        otherTests: ''
      } : { 
        temperature: '', 
        symptoms: '', 
        result: '', 
        tests: [],
        otherTests: '',
        date: new Date().toISOString().slice(0,10) 
      },
      init() {},
      async save() {
        // Si hay 'Otras pruebas' seleccionadas, las añadimos al array de tests
        if (this.review.otherTests && this.review.tests?.includes('Otras pruebas')) {
          this.review.tests = [
            ...this.review.tests.filter(t => t !== 'Otras pruebas'),
            `Otras: ${this.review.otherTests}`
          ];
        }
        const payload = { 
          ...this.review,
          // Convertimos el array de tests a string para almacenamiento
          tests: this.review.tests?.join(', ') || ''
        };
        try {
          if (editKey !== null) {
            await updateReview(patientId, editKey, payload);
          } else {
            await saveReview(patientId, payload);
          }
          window.dispatchEvent(new CustomEvent('navigate', { detail: { page: 'Home' } }));
        } catch (e) {
          alert(e?.message || 'Error al guardar la revisión.');
        }
      }
    }));
    Alpine.start();
  },
  Drawings: async () => {
    const html = await fetch('pages/Drawings.html').then(r => r.text());
    document.getElementById('app').innerHTML = html;
    const comp = await fetch('components/DrawingsGrid.html').then(r => r.text());
    const mount = document.getElementById('drawings-grid');
    if (mount) {
      mount.innerHTML = comp;
      Alpine.data('drawings', () => ({
        items: [],
        error: '',
        loading: false,
        async init() {
          this.loading = true;
          try {
            const res = await fetch('drawings/index.json', { cache: 'no-store' });
            if (!res.ok) throw new Error('No se encontró drawings/index.json');
            const list = await res.json();
            // list can be array of filenames or objects with {src, title}
            this.items = (Array.isArray(list) ? list : []).map(entry => {
              const src = typeof entry === 'string' ? `drawings/${entry}` : `drawings/${entry.src}`;
              const title = typeof entry === 'string' ? entry : (entry.title || entry.src);
              const ext = (src.split('.').pop() || '').toLowerCase();
              const isImage = ['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg'].includes(ext);
              return { src, title, isImage };
            }).filter(it => it.src);
          } catch (e) {
            this.error = 'No se pudieron cargar los dibujos. Asegúrate de crear drawings/index.json';
          } finally {
            this.loading = false;
          }
        },
        open(item) {
          window.open(item.src, '_blank');
        }
      }));
      Alpine.start();
    }
  }
};

// Router handler
function navigate(page, id = null) {
  if (routes[page]) routes[page](id);
}
window.addEventListener('navigate', e => {
  const { page, id } = e.detail;
  navigate(page, id);
});

// SPA navigation (hash-based for demo)
window.onhashchange = () => {
  const [page, id] = location.hash.replace('#', '').split('/');
  navigate(page || 'Home', id);
};

// Inicialización
document.addEventListener('DOMContentLoaded', () => {
  if (!location.hash) {
    location.hash = '#Home';
  } else {
    const [page, id] = location.hash.replace('#', '').split('/');
    navigate(page || 'Home', id);
  }
  Alpine.start();
});
