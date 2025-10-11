// Robust, privacy-friendly view counter for static hosting (GitHub Pages)
// Strategy:
// - Uses CountAPI (HTTPS) to store a global counter per host+path
// - Increments only once per visitor per day (localStorage throttle)
// - Falls back to GET (no increment) if already counted today
// - Initializes missing keys, caches last known value locally
// - If all network calls fail (adblock/offline), shows cached or existing value

(function() {
    document.addEventListener('DOMContentLoaded', async () => {
        const viewEl = document.getElementById('view-count');
        if (!viewEl) return;

        // Build namespace/key from current location to avoid collisions
        const sanitize = (s) => (s || '').toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');
        const host = sanitize(window.location.hostname || 'localhost');
        const path = sanitize(window.location.pathname || 'root');
        const namespace = `views_${host}`;
        const key = `page_${path}`;

        const LS_PREFIX = `vc_${namespace}_${key}`;
        const LS_LAST_DAY = `${LS_PREFIX}_last_day`;
        const LS_CACHED = `${LS_PREFIX}_cached`;

        // Show cached count immediately if we have it
        try {
            const cached = localStorage.getItem(LS_CACHED);
            if (cached && /^[0-9]+$/.test(cached)) {
                viewEl.textContent = cached;
            }
        } catch (_) {}

        const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
        let alreadyCountedToday = false;
        try {
            alreadyCountedToday = localStorage.getItem(LS_LAST_DAY) === today;
        } catch (_) {}

        const base = 'https://api.countapi.xyz';

        async function fetchJSON(url, options) {
            const res = await fetch(url, { cache: 'no-store', ...options });
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            return res.json();
        }

        async function ensureExists() {
            // Try GET; if 404, create the key with value 0
            try {
                return await fetchJSON(`${base}/get/${namespace}/${key}`);
            } catch (e) {
                // Attempt create, then return created value
                try {
                    return await fetchJSON(`${base}/create?namespace=${encodeURIComponent(namespace)}&key=${encodeURIComponent(key)}&value=0`);
                } catch (e2) {
                    throw e2;
                }
            }
        }

        async function updateCounter() {
            try {
                await ensureExists();

                // Decide endpoint based on whether we should increment today
                const endpoint = alreadyCountedToday ? 'get' : 'hit';
                const data = await fetchJSON(`${base}/${endpoint}/${namespace}/${key}`);
                if (typeof data.value === 'number') {
                    viewEl.textContent = data.value;
                    try {
                        localStorage.setItem(LS_CACHED, String(data.value));
                        if (!alreadyCountedToday) localStorage.setItem(LS_LAST_DAY, today);
                    } catch (_) {}
                }
            } catch (e) {
                // Final fallback: leave existing/cached value in place
                // Optionally, try one last GET without throwing
                try {
                    const data = await fetchJSON(`${base}/get/${namespace}/${key}`);
                    if (typeof data.value === 'number') {
                        viewEl.textContent = data.value;
                        localStorage.setItem(LS_CACHED, String(data.value));
                    }
                } catch (_) {
                    // Silent fallback
                }
            }
        }

        updateCounter();
    });
})();
// Simple HTTPS view counter for GitHub Pages (CountAPI)
// Increments a counter and displays it; if it fails, leaves the current value untouched.

document.addEventListener('DOMContentLoaded', async () => {
    const viewEl = document.getElementById('view-count');
    if (!viewEl) return;

    const namespace = 'fnix_xyz';
    const key = 'homepage';
    try {
        const res = await fetch(`https://api.countapi.xyz/hit/${namespace}/${key}`);
        if (!res.ok) throw new Error('count api failed');
        const data = await res.json();
        if (typeof data.value === 'number') {
            viewEl.textContent = data.value;
        }
    } catch (e) {
        // fail silently; keep whatever is already shown
        console.debug('View counter fallback:', e);
    }
});