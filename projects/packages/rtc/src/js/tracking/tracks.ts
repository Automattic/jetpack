import analytics from '@automattic/jetpack-analytics';
import { select } from '@wordpress/data';

type RtcTransport = 'pinghub' | 'http-polling';

interface JetpackRtcGlobals {
	providers?: string[];
}

interface EditorSelectors {
	getCurrentPostId?: () => number | undefined;
	getCurrentPostType?: () => string | undefined;
}

interface CoreSelectors {
	getCurrentUser?: () => { id?: number } | undefined;
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
 * Read the current post context from the editor store.
 *
 * This is transport-agnostic: it works on both PingHub and HTTP-polling sites,
 * unlike `window.jetpackRTC`, which the server only injects on the PingHub path.
 *
 * @return The current post id and type (each undefined when unavailable).
 */
function getPostContext(): { post_id?: number; post_type?: string } {
	const editor = select( 'core/editor' ) as EditorSelectors | undefined;
	return {
		post_id: editor?.getCurrentPostId?.(),
		post_type: editor?.getCurrentPostType?.(),
	};
}

/**
 * The current user's WordPress user id.
 *
 * This is in the same id-space as the `contributors` list (the WP user id, which
 * is the WordPress.com id on Simple sites but the site-local id on Atomic), so it
 * lets the recording user be located within the room roster — useful on Atomic,
 * where `contributors` ids do not match the wpcom id Tracks records as `_ui`.
 *
 * @return The WP user id, or undefined when unavailable.
 */
function getCurrentUserId(): number | undefined {
	const core = select( 'core' ) as CoreSelectors | undefined;
	return core?.getCurrentUser?.()?.id;
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
	try {
		analytics.tracks.recordEvent( eventName, {
			transport: getTransport(),
			wp_user_id: getCurrentUserId(),
			...getPostContext(),
			...properties,
		} );
	} catch {
		// Telemetry must never break the editor.
	}
}
