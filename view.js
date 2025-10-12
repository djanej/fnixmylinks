// Client-side daily-throttled view counter using Countty Worker
// - Increments via GET to your Worker once per device/day
// - Displays the badge image for the current value
// - Retries increment with exponential backoff; always shows the badge regardless

document.addEventListener('DOMContentLoaded', async () => {

    const HIT_URL = 'https://skye.anej-programer2.workers.dev/views?slug=fnix';
    const BADGE_URL = 'https://skye.anej-programer2.workers.dev/badge?slug=fnix';
	const BADGE_ID = 'view-badge';
	const BADGE_OBJECT_ID = 'view-badge-object';
    const LS_VIEWED_AT = 'fnix_viewed_at';
    const ONE_DAY_MS = 24 * 60 * 60 * 1000;

    function withCacheBust(url) {
        try {
            const u = new URL(url);
            u.searchParams.set('_', String(Date.now()));
            return u.toString();
        } catch (_) {
            const base = url || BADGE_URL;
            return base + (base.includes('?') ? '&' : '?') + '_=' + Date.now();
        }
    }

    function getBadgeParent() {
		const img = document.getElementById(BADGE_ID);
		const obj = document.getElementById(BADGE_OBJECT_ID);
		return (img && img.parentElement) || (obj && obj.parentElement) || document.querySelector('.views-container');
	}

	function renderBadgeObject() {
		try {
			const parent = getBadgeParent();
			if (!parent) return;
            const existingImg = document.getElementById(BADGE_ID);
            const existingSrc = existingImg && existingImg.getAttribute('src');
            if (existingImg) existingImg.remove();
			let obj = document.getElementById(BADGE_OBJECT_ID);
			if (!obj) {
				obj = document.createElement('object');
				obj.id = BADGE_OBJECT_ID;
				obj.type = 'image/svg+xml';
				obj.style.height = '16px';
                obj.style.verticalAlign = 'text-bottom';
				parent.appendChild(obj);
			}
            obj.data = existingSrc || BADGE_URL;
		} catch (_) {}
	}

	function renderBadgeImage() {
		try {
            const badgeImg = document.getElementById(BADGE_ID);
            if (!badgeImg) return;
            badgeImg.addEventListener('error', () => { renderBadgeObject(); });
		} catch (_) {}
	}

	function refreshBadge() {
        try {
            const img = document.getElementById(BADGE_ID);
            if (img) { img.src = withCacheBust(img.getAttribute('src') || BADGE_URL); return; }
            const obj = document.getElementById(BADGE_OBJECT_ID);
            if (obj) { obj.data = withCacheBust(obj.getAttribute('data') || BADGE_URL); }
        } catch (_) {}
	}

// Wire up fallback on existing badge image (if present)
renderBadgeImage();

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
				if (res.ok) {
					markIncrementedNow();
					refreshBadge();
					return true;
				}
            } catch (_) {}
        }
        return false;
    }

    if (shouldIncrementToday()) {
        tryIncrementWithBackoff();
    }
});