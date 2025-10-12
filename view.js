// Client-side daily-throttled view counter using Countty Worker
// - Shows cached number immediately if available
// - Increments via GET to your Worker when user clicks enter (with backoff)
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
					const currentShown = Number.parseInt(viewEl.textContent, 10) || 0;
					const finalVal = value > currentShown ? value : currentShown;
					viewEl.textContent = String(finalVal);
					try { localStorage.setItem(LS_CACHED, String(finalVal)); } catch (_) {}
					markIncrementedNow();
					return true;
				}
				// If no numeric comes back, we keep the local increment already shown
				markIncrementedNow();
				return true;
			} catch (_) {}
		}
		return false;
	}

	function recordView() {
		// Local immediate increment for UX
		try {
			const currentLocal = Number.parseInt(viewEl.textContent, 10) || 0;
			const nextLocal = currentLocal + 1;
			viewEl.textContent = String(nextLocal);
			localStorage.setItem(LS_CACHED, String(nextLocal));
		} catch (_) {}
		// Server call in background
		tryIncrementWithBackoff();
	}

	const enterBtn = document.querySelector('#overlay .overlaybtn');
	const attach = () => { try { enterBtn && enterBtn.addEventListener('click', recordView, { once: true }); } catch (_) {} };
	attach();
	// Also listen for a cross-script event in case the overlay button changes
	window.addEventListener('user-enter', () => { recordView(); }, { once: true });

	// Do not increment on load
});