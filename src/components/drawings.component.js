
export default function drawingsComponent() {
    return {
        items: [],
        error: '',
        loading: false,
        async init() {
            this.loading = true;
            try {
                // Load json with images
                const res = await fetch('drawings/index.json', { cache: 'no-store' });
                if (!res.ok) {
                    throw new Error('No se encontró la lista de dibujos');
                }
                this.items = await res.json();
            } catch (e) {
                this.error = 'No se pudieron cargar los dibujos. Asegúrate de crear drawings/index.json';
            } finally {
                this.loading = false;
            }
        },
        open(item) {
            window.open("/drawings/" + item.src, '_blank');
        }
    };
}