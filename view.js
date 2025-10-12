// Client-side daily-throttled view counter using Countty Worker
// - Increments via GET to your Worker once per device/day
// - Displays the badge image for the current value
// - Retries increment with exponential backoff; always shows the badge regardless

document.addEventListener('DOMContentLoaded', async () => {
    const viewEl = document.getElementById('view-count');
    if (!viewEl) return;

    const HIT_URL = 'https://skye.anej-programer2.workers.dev/views?slug=fnix';
    const BADGE_URL = 'https://skye.anej-programer2.workers.dev/badge?slug=fnix';
	const BADGE_ID = 'view-badge';
	const BADGE_OBJECT_ID = 'view-badge-object';
    const LS_VIEWED_AT = 'fnix_viewed_at';
    const ONE_DAY_MS = 24 * 60 * 60 * 1000;

	function bustBadgeUrl() {
        return BADGE_URL + (BADGE_URL.includes('?') ? '&' : '?') + '_=' + Date.now();
    }

	function getBadgeParent() {
		return viewEl.parentElement || document.querySelector('.views-container');
	}

	function renderBadgeObject() {
		try {
			const parent = getBadgeParent();
			if (!parent) return;
			const existingImg = document.getElementById(BADGE_ID);
			if (existingImg) existingImg.remove();
			let obj = document.getElementById(BADGE_OBJECT_ID);
			if (!obj) {
				obj = document.createElement('object');
				obj.id = BADGE_OBJECT_ID;
				obj.type = 'image/svg+xml';
				obj.style.height = '16px';
				obj.style.verticalAlign = 'text-bottom';
				viewEl.style.display = 'none';
				parent.appendChild(obj);
			}
			obj.data = BADGE_URL;
		} catch (_) {}
	}

	function renderBadgeImage() {
		try {
			const parent = getBadgeParent();
			if (!parent) return;
			if (document.getElementById(BADGE_ID) || document.getElementById(BADGE_OBJECT_ID)) return;
			const badgeImg = document.createElement('img');
			badgeImg.id = BADGE_ID;
			badgeImg.alt = 'visitors';
			badgeImg.decoding = 'async';
			badgeImg.loading = 'lazy';
			badgeImg.style.height = '16px';
			badgeImg.style.verticalAlign = 'text-bottom';
			badgeImg.addEventListener('error', () => { renderBadgeObject(); });
			viewEl.style.display = 'none';
			parent.appendChild(badgeImg);
			badgeImg.src = BADGE_URL; // no cache-bust initially, maximize compatibility
		} catch (_) {}
	}

	function refreshBadge() {
		try {
			const img = document.getElementById(BADGE_ID);
			if (img) { img.src = bustBadgeUrl(); return; }
			const obj = document.getElementById(BADGE_OBJECT_ID);
			if (obj) { obj.data = bustBadgeUrl(); }
		} catch (_) {}
	}

	// Insert badge now
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