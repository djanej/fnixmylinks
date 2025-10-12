// Client-side daily-throttled ping to Countty Worker (no UI rendering)
// - Increments via GET to your Worker once per device/day
// - Silent backoff retries; no visual element injected

document.addEventListener('DOMContentLoaded', async () => {

    const HIT_URL = 'https://skye.anej-programer2.workers.dev/views?slug=fnix';
    const LS_VIEWED_AT = 'fnix_viewed_at';
    const ONE_DAY_MS = 24 * 60 * 60 * 1000;

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

    async function tryIncrementWithBackoff() {
        const delays = [0, 1000, 3000, 7000];
        for (let i = 0; i < delays.length; i++) {
            if (delays[i] > 0) await new Promise(r => setTimeout(r, delays[i]));
            try {
                const res = await fetch(HIT_URL, { method: 'GET', cache: 'no-store' });
                if (res.ok) { markIncrementedNow(); return true; }
            } catch (_) {}
        }
        return false;
    }

    if (shouldIncrementToday()) {
        tryIncrementWithBackoff();
    }
});