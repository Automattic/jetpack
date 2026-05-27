import { TextDecoder, TextEncoder } from 'node:util';

// JSDOM doesn't ship `TextEncoder` / `TextDecoder`; @tanstack/router-core (a
// transitive dep via @wordpress/admin-ui) requires them at module load time.
if ( typeof globalThis.TextEncoder === 'undefined' ) {
	globalThis.TextEncoder = TextEncoder as unknown as typeof globalThis.TextEncoder;
}
if ( typeof globalThis.TextDecoder === 'undefined' ) {
	globalThis.TextDecoder = TextDecoder as unknown as typeof globalThis.TextDecoder;
}

// JSDOM doesn't ship `ResizeObserver`; `@wordpress/ui`'s Tabs.List uses it at
// effect time. A no-op stub is enough for tests — we never depend on resize
// callbacks firing.
if ( typeof globalThis.ResizeObserver === 'undefined' ) {
	class ResizeObserverStub {
		observe(): void {}
		unobserve(): void {}
		disconnect(): void {}
	}
	( globalThis as unknown as Record< string, unknown > ).ResizeObserver = ResizeObserverStub;
}
