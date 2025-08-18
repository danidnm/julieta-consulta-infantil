import {getSupabaseConfig, sbUploadToBucket} from "../supabase.js";
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

        async uploadPhoto(e) {
            const file = e.target.files[0];
            if (!file) return;
            try {
                const { photosBucket } = getSupabaseConfig();
                const mime = file.type || 'image/jpeg';
                const guessedExt = (file.name && file.name.includes('.')) ? file.name.split('.').pop() : '';
                const extFromMime = mime.split('/')[1] || 'jpg';
                const ext = (guessedExt || extFromMime || 'jpg').toLowerCase().replace(/[^a-z0-9]/g, '') || 'jpg';
                const path = `patients/${this.patient.id}/avatar-${Date.now()}.${ext}`;
                this.patient.photo = await sbUploadToBucket(photosBucket, path, file, mime);
                await savePatients(this.patient);
            } catch (err) {
                console.error(err);
                alert(err?.message || 'No se pudo subir la foto. Revisa los datos de conexión.');
            }
        }
    };
}