import { getPatients } from '../store/patients'

export default function patientListComponent() {
    return {
        error: null,
        loading: true,
        patients: [],
        filteredPatients: [],
        search: '',
        async init() {

            try {
                const data = await getPatients();
                this.patients = Array.isArray(data) ? data : [];
                this.filteredPatients = this.patients;
            }
            catch (e) {
                console.error(e);
                this.error = 'No se pudieron cargar los pacientes';
                this.patients = [];
                this.filteredPatients = [];
            }
            finally {
                this.loading = false;
            }
        },
        filter() {
            const base = Array.isArray(this.patients) ? this.patients : [];
            const q = (this.search || '').toLowerCase().trim();
            this.filteredPatients = base.filter(p =>
                (p.name || '').toLowerCase().includes(q)
            );
        }
    }
}
