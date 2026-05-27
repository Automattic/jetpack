import { TextDecoder, TextEncoder } from 'node:util';

// JSDOM doesn't ship `TextEncoder` / `TextDecoder`; @tanstack/router-core (a
// transitive dep via @wordpress/admin-ui) requires them at module load time.
if ( typeof globalThis.TextEncoder === 'undefined' ) {
	globalThis.TextEncoder = TextEncoder as unknown as typeof globalThis.TextEncoder;
}
if ( typeof globalThis.TextDecoder === 'undefined' ) {
	globalThis.TextDecoder = TextDecoder as unknown as typeof globalThis.TextDecoder;
}
