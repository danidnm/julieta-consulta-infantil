import Alpine from 'alpinejs';
import { getPatients, savePatients, getPatientById, getReviews, saveReview, updateReview } from './store/patients';

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
      init() {
        this.patients = getPatients();
        this.filteredPatients = this.patients;
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
      patient: id ? { ...getPatientById(id) } : { id: crypto.randomUUID(), name: '', gender: '', birthdate: '', photo: '' },
      reviews: [],
      init() {
        // Cargar revisiones si el paciente ya existe
        if (id) {
          this.reviews = getReviews(this.patient.id) || [];
        }
      },
      uploadPhoto(e) {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (ev) => { this.patient.photo = ev.target.result; };
        reader.readAsDataURL(file);
      },
      save() {
        let patients = getPatients();
        const idx = patients.findIndex(p => p.id === this.patient.id);
        if (idx >= 0) patients[idx] = this.patient;
        else patients.push(this.patient);
        savePatients(patients);
        window.dispatchEvent(new CustomEvent('navigate', { detail: { page: 'Home' } }));
      }
    }));
    Alpine.start();
  },
  ReviewNew: async (id) => {
    const html = await fetch('pages/ReviewNew.html').then(r => r.text());
    document.getElementById('app').innerHTML = html;
    // Cargar componente formulario revisión
    const comp = await fetch('components/ReviewForm.html').then(r => r.text());
    document.getElementById('review-form').innerHTML = comp;

    // id puede venir como "patientId" o "patientId:index" si es edición
    const [patientId, indexStr] = (id || '').split(':');
    const editIndex = Number.isFinite(Number(indexStr)) ? parseInt(indexStr, 10) : null;
    const existing = editIndex !== null ? (getReviews(patientId)[editIndex] || null) : null;

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
      save() {
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
        if (editIndex !== null) {
          updateReview(patientId, editIndex, payload);
        } else {
          saveReview(patientId, payload);
        }
        window.dispatchEvent(new CustomEvent('navigate', { detail: { page: 'Home' } }));
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
  },
  Settings: async () => {
    const html = await fetch('pages/Settings.html').then(r => r.text());
    document.getElementById('app').innerHTML = html;
    Alpine.start();
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
