import analytics from '@automattic/jetpack-analytics';

type RtcTransport = 'pinghub' | 'http-polling';

interface JetpackRtcGlobals {
	providers?: string[];
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
 * `window.jetpackRTC` is only injected on the PingHub path, so its absence
 * means the built-in HTTP-polling transport is in use.
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
 * `post_id`, `post_type`, and `wp_user_id` are read from the server-injected
 * `window.jetpackRtcNotices` config (present on both transports, and available
 * synchronously) rather than from the editor store or awareness — those aren't
 * reliably populated when an event fires very early, e.g. the room-limit block
 * on a tab that has only just connected. `wp_user_id` is the site-local WP user
 * id (= the wpcom id on Simple sites), the same id-space as `contributors`.
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
	const notices = window.jetpackRtcNotices;
	const props: Record< string, unknown > = {
		transport: getTransport(),
		post_id: notices?.postId,
		post_type: notices?.postType,
		wp_user_id: notices?.userId,
		...properties,
	};
	try {
		// Tracks serialises a present-but-nullish value as the literal string
		// "null"/"undefined" rather than omitting it, so drop those keys entirely.
		analytics.tracks.recordEvent(
			eventName,
			Object.fromEntries( Object.entries( props ).filter( ( [ , value ] ) => value != null ) )
		);
	} catch {
		// Telemetry must never break the editor.
	}
}
