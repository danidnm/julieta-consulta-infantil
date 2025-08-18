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
                const id = app?.dataset?.id;
                if (id) {
                    this.review = await getReviewById(id);
                    this.patient = await getPatientById(this.review.patient_id);
                } else {
                    // New review. Generate new ID.
                    this.review.id = (crypto?.randomUUID?.() || Date.now().toString());
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
        }
    };
}