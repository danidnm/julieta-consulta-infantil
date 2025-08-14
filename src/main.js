import Alpine from 'alpinejs';
import { getPatients, savePatients, getPatientById, getReviews, saveReview } from './store/patients';
import './styles/tailwind.css'

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
    const html = await fetch('/pages/PatientEdit.html').then(r => r.text());
    document.getElementById('app').innerHTML = html;
    // Cargar componente formulario paciente
    const comp = await fetch('/components/PatientForm.html').then(r => r.text());
    document.getElementById('patient-form').innerHTML = comp;
    Alpine.data('patientForm', () => ({
      patient: id ? { ...getPatientById(id) } : { id: crypto.randomUUID(), name: '', gender: '', birthdate: '', photo: '' },
      init() {},
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
    const html = await fetch('/pages/ReviewNew.html').then(r => r.text());
    document.getElementById('app').innerHTML = html;
    // Cargar componente formulario revisión
    const comp = await fetch('/components/ReviewForm.html').then(r => r.text());
    document.getElementById('review-form').innerHTML = comp;
    Alpine.data('reviewForm', () => ({
      review: { 
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
        
        saveReview(id, { 
          ...this.review,
          // Convertimos el array de tests a string para almacenamiento
          tests: this.review.tests?.join(', ') || ''
        });
        window.dispatchEvent(new CustomEvent('navigate', { detail: { page: 'Home' } }));
      }
    }));
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
