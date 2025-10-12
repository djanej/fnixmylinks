// Client-side daily-throttled view counter using Countty Worker
// - Shows cached number immediately if available
// - Increments via GET to your Worker once per device/day with backoff
// - Parses numeric response and updates #view-count; falls back to cached value

document.addEventListener('DOMContentLoaded', async () => {

    const viewEl = document.getElementById('view-count');
    if (!viewEl) return;

    const HIT_URL = 'https://skye.anej-programer2.workers.dev/views?slug=fnix';
    const BADGE_URL = 'https://skye.anej-programer2.workers.dev/badge?slug=fnix&label=Visitors&color=ff9900&style=flat-square';
    const LS_VIEWED_AT = 'fnix_viewed_at';
    const LS_CACHED = 'fnix_cached_value';
    const ONE_DAY_MS = 24 * 60 * 60 * 1000;

    // Show cached value immediately if present
    try {
        const cached = localStorage.getItem(LS_CACHED);
        if (cached && /^\d+$/.test(cached)) {
            viewEl.textContent = cached;
        }
    } catch (_) {}

    function shouldIncrementToday() {
        try {
            const last = localStorage.getItem(LS_VIEWED_AT);
            if (!last) return true;
            const lastAt = Number(last);
            if (!Number.isFinite(lastAt)) return true;
            return Date.now() - lastAt >= ONE_DAY_MS;
        } catch (_) {
            return true;
        }
    }

    function markIncrementedNow() {
        try { localStorage.setItem(LS_VIEWED_AT, String(Date.now())); } catch (_) {}
    }

    function extractNumberFromText(text) {
        try {
            const json = JSON.parse(text);
            if (typeof json.value === 'number') return json.value;
        } catch (_) {}
        const match = text.match(/\b(\d{1,10})\b/);
        return match ? Number(match[1]) : null;
    }

    async function tryIncrementWithBackoff() {
        const delays = [0, 1000, 3000, 7000];
        for (let i = 0; i < delays.length; i++) {
            if (delays[i] > 0) await new Promise(r => setTimeout(r, delays[i]));
            try {
                const res = await fetch(HIT_URL, { method: 'GET', cache: 'no-store' });
                if (!res.ok) continue;
                const text = await res.text();
                const value = extractNumberFromText(text);
                if (typeof value === 'number' && Number.isFinite(value)) {
                    viewEl.textContent = String(value);
                    try { localStorage.setItem(LS_CACHED, String(value)); } catch (_) {}
                    markIncrementedNow();
                    return true;
                }
                // Fallback: no numeric returned, locally increment the displayed/cached value
                const current = Number.parseInt(viewEl.textContent, 10) || Number.parseInt(localStorage.getItem(LS_CACHED) || '', 10) || 0;
                const next = current + 1;
                viewEl.textContent = String(next);
                try { localStorage.setItem(LS_CACHED, String(next)); } catch (_) {}
                markIncrementedNow();
                return true;
            } catch (_) {}
        }
        return false;
    }

    async function tryUpdateFromBadge() {
        try {
            const res = await fetch(BADGE_URL, { cache: 'no-store' });
            if (!res.ok) return;
            const text = await res.text();
            const value = extractNumberFromText(text);
            if (typeof value === 'number' && Number.isFinite(value)) {
                viewEl.textContent = String(value);
                try { localStorage.setItem(LS_CACHED, String(value)); } catch (_) {}
            }
        } catch (_) {}
    }

    if (shouldIncrementToday()) {
        tryIncrementWithBackoff();
    } else {
        // Not incrementing today; try to refresh from badge if possible
        tryUpdateFromBadge();
    }
});