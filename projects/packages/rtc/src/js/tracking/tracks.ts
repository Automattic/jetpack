import analytics from '@automattic/jetpack-analytics';

type RtcTransport = 'pinghub' | 'http-polling';

interface JetpackRtcGlobals {
	providers?: string[];
	currentPostId?: number;
	currentPostType?: string;
}

/**
 * Read the server-provided RTC globals off `window`.
 *
 * @return The `window.jetpackRTC` config, or an empty object when absent.
 */
function getRtcGlobals(): JetpackRtcGlobals {
	return ( window as unknown as { jetpackRTC?: JetpackRtcGlobals } ).jetpackRTC ?? {};
}

/**
 * Determine the active RTC transport from the providers configured by the server.
 *
 * @return 'pinghub' when the PingHub WebSocket provider is active, otherwise 'http-polling'.
 */
export function getTransport(): RtcTransport {
	const { providers } = getRtcGlobals();
	return Array.isArray( providers ) && providers.includes( 'pinghub' ) ? 'pinghub' : 'http-polling';
}

/**
 * Record an RTC Tracks event with the common properties merged in.
 *
 * `blog_id` is attached automatically by `@automattic/jetpack-analytics` from
 * `window.jpTracksContext`, so it is intentionally not set here. Event names
 * must be prefixed `jetpack_` or the analytics package drops them silently.
 *
 * @param eventName  - Tracks event name (must start with `jetpack_`).
 * @param properties - Event-specific properties.
 */
export function recordRtcEvent(
	eventName: string,
	properties: Record< string, unknown > = {}
): void {
	const { currentPostId, currentPostType } = getRtcGlobals();
	try {
		analytics.tracks.recordEvent( eventName, {
			transport: getTransport(),
			post_id: currentPostId,
			post_type: currentPostType,
			...properties,
		} );
	} catch {
		// Telemetry must never break the editor.
	}
}
