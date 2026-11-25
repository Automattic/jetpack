// DataViews' infinite scroll observes rows on mount; jsdom ships no IntersectionObserver.
if ( globalThis.window && ! window.IntersectionObserver ) {
	window.IntersectionObserver = class IntersectionObserver {
		observe() {}
		unobserve() {}
		disconnect() {}
		takeRecords() {
			return [];
		}
	};
}
