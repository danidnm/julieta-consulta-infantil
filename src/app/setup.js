import Alpine from 'alpinejs';

window.Alpine = Alpine;

// --- x-include directive ---
const includeCache = new Map();

document.addEventListener('alpine:init', () => {
    Alpine.directive('include', (el, { expression }, { cleanup }) => {
        let url = '';
        try { url = Alpine.evaluate(el, expression); } catch { url = expression; }

        let stopped = false;
        cleanup(() => { stopped = true; });

        (async () => {
            try {
                const html = includeCache.has(url)
                    ? includeCache.get(url)
                    : await fetch(url).then(r => r.text());
                includeCache.set(url, html);
                if (stopped) return;
                el.innerHTML = html;
                Alpine.initTree(el);
            } catch (e) { console.error('x-include error:', e); }
        })();
    });

    // Auto‑register Alpine components
    const modules = import.meta.glob('../components/**/*.component.js', { eager: true });
    for (const [path, mod] of Object.entries(modules)) {
        const name = path.split('/').pop().replace('.component.js', '');
        Alpine.data(name, mod.default);
    }
});

export function startAlpine() {
    Alpine.start();
}
