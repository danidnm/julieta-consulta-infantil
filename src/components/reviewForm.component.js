import {getSupabaseConfig, sbUploadToBucket} from "../supabase.js";
import { getReviewById, saveReview } from '../store/reviews';
import { getPatientById } from '../store/patients';

export default function reviewFormComponent() {
    return {
        loading: true,
        error: null,
        review: { id: '', date: '', patient_id: '', temperature: '', symptoms: '', tests: [], result: '' },
        patient: null,

        async init() {
            try {
                // Router sets the ID in the app node
                const app = document.getElementById('app');
                const page = app?.dataset?.page || '';
                const id = app?.dataset?.id || '';

                // ID can be review id (edition) or patient id (new revision)
                this.mode = page === 'ReviewEdit' ? 'edit' : 'new'

                // Edit or new behaves differnt
                if (this.mode === 'edit') {
                    this.review = await getReviewById(id);
                    this.patient = await getPatientById(this.review.patient_id);
                }
                else {
                    // New review. Generate new ID and load only the patient
                    // Initialize default data
                    this.review.id = (crypto?.randomUUID?.() || Date.now().toString());
                    this.review.date = this.today();
                    this.review.patient_id = id;
                    this.patient = await getPatientById(this.review.patient_id);

                }
            } catch (e) {
                console.error(e);
                this.error = 'No se pudo cargar revisión';
            } finally {
                this.loading = false;
            }
        },

        async save() {
            try {
                this.loading = true;
                await saveReview(this.review);
            }
            catch (e) {
                console.error(e);
                this.error = 'No se pudo guardar la revisión';
            }
            finally {
                this.loading = false;
            }
        },

        today() {
            const d = new Date()
            const mm = String(d.getMonth() + 1).padStart(2, '0')
            const dd = String(d.getDate()).padStart(2, '0')
            return `${d.getFullYear()}-${mm}-${dd}`
        }
    };
}