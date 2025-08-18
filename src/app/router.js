// Convention router: "#Home" -> "pages/Home.html", "#patient-details" -> "pages/PatientDetails.html"

const app = document.getElementById('app');

function toFileBase(page) {
    if (!page) return 'Home';
    if (!/^[A-Za-z0-9_-]+$/.test(page)) return 'Home'; // sanitize
    // kebab -> PascalCase (optional). Remove if you prefer exact names.
    return page.split('-').filter(Boolean)
        .map(s => s[0].toUpperCase() + s.slice(1)).join('');
}

function parseHash() {
    const raw = location.hash.replace(/^#/, '');
    const [page, id] = raw.split('/');
    return { page: page || 'Home', id };
}

async function render(path) {
    try {
        const res = await fetch(path, { cache: 'no-cache' });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return await res.text();
    } catch (e) {
        // Try 404 page, else inline
        try {
            const r404 = await fetch('pages/404.html');
            return r404.ok ? await r404.text() : '<h1>Not found</h1>';
        } catch {
            return '<h1>Not found</h1>';
        }
    }
}

export async function handleRoute() {
    const { page, id } = parseHash();
    const fileBase = toFileBase(page);
    const path = `pages/${fileBase}.html`;

    // optional loading state
    app.innerHTML = '<div class="p-4 opacity-70">Loading…</div>';

    const html = await render(path);
    app.innerHTML = html;

    // expose route data to components if needed
    app.dataset.page = fileBase;
    app.dataset.id = id ? id : '';

    // Alpine: initialize just this subtree
    window.Alpine?.initTree(app);

    // optional: document title
    document.title = `${fileBase} · My App`;
}

export function startRouter() {
    window.addEventListener('hashchange', handleRoute);
    if (!location.hash) {
        location.hash = '#Home'; // triggers hashchange in most browsers
    } else {
        // initial render for existing hash
        handleRoute();
    }
}

// Optional helper for programmatic nav
export function navigate(to) {
    location.hash = to.startsWith('#') ? to : `#${to}`;
}
