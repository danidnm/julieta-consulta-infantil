import { getPatientById, savePatients } from '../store/patients';
import { getReviews } from '../store/reviews';

export default function patientFormComponent() {
    return {
        loading: true,
        error: null,
        patient: { id: '', name: '', gender: '', birthdate: '', photo: '' },
        reviews: [],

        async init() {
            try {
                // El router deja el id en data-id del #app
                const app = document.getElementById('app');
                const id = app?.dataset?.id;
                if (id) {
                    this.patient = await getPatientById(id);
                    this.reviews = await getReviews(this.patient.id);
                } else {
                    // nuevo paciente: genera id si está disponible
                    this.patient.id = (crypto?.randomUUID?.() || Date.now().toString());
                }
            } catch (e) {
                console.error(e);
                this.error = 'No se pudo cargar el paciente';
            } finally {
                this.loading = false;
            }
        },

        async save() {
            try {
                this.loading = true;
                await savePatients(this.patient);
            }
            catch (e) {
                console.error(e);
                this.error = 'No se pudo guardar el paciente';
            }
            finally {
                this.loading = false;
            }
        },

        async uploadPhoto(ev) {
            const file = ev?.target?.files?.[0];
            if (!file) return;
            // Implementa aquí subida real si usas storage; de momento, preview local
            const url = URL.createObjectURL(file);
            this.patient.photo = url;
        }
    };
}