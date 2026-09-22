import jetpackAnalytics from '@automattic/jetpack-analytics';
import type { ConnectionErrorObject } from './types.ts';

/**
 * Canonical Tracks events for interactions inside a connection error notice.
 *
 * One event per interaction; the surface it happened on is carried in the
 * `context` payload property (see `trackConnectionErrorNoticeEvent`) rather than
 * baked into the event name, so a single event answers "how many reconnect
 * clicks across every surface?" while `context` breaks it down per consumer.
 */
export const CONNECTION_ERROR_NOTICE_EVENTS = {
	/** The built-in "Restore Connection" CTA. */
	reconnect: 'jetpack_connection_error_notice_reconnect_cta_click',
	/** A link an error carries in the notice body, e.g. "Visit Site Health". */
	noticeLink: 'jetpack_connection_error_notice_link_click',
	/** The "Contact Jetpack Support" link. */
	supportLink: 'jetpack_connection_error_notice_support_link_click',
} as const;

export interface ConnectionErrorTrackingOptions {
	/**
	 * Consumer dispatch hook. When supplied (e.g. My Jetpack), events route
	 * through it for the consumer's enriched analytics; when absent, they record
	 * straight to Tracks so a bare notice still tracks without any wiring.
	 */
	trackingCallback?: ( ( event: string, data: object ) => void ) | null;
	/** The surface reporting the event, e.g. 'my-jetpack', 'protect'. */
	trackingContext?: string;
	/** The error the notice is describing, for the standard payload. */
	error?: ConnectionErrorObject;
}

/**
 * Fire one connection-error-notice Tracks event with the standard payload
 * (`context`, `error_code`, `audience`), plus any event-specific `extra`.
 *
 * @param {string}                         event   - One of CONNECTION_ERROR_NOTICE_EVENTS.
 * @param {ConnectionErrorTrackingOptions} options - Dispatch target and payload context.
 * @param {object}                         extra   - Event-specific payload additions.
 */
export function trackConnectionErrorNoticeEvent(
	event: string,
	{ trackingCallback, trackingContext, error }: ConnectionErrorTrackingOptions,
	extra: object = {}
): void {
	const payload = {
		context: trackingContext ?? null,
		// The payload is server-shaped, so report a code only when it truly is one
		// rather than sending Tracks whatever arrived.
		error_code: typeof error?.error_code === 'string' ? error.error_code : null,
		audience: error?.audience ?? 'site',
		...extra,
	};

	try {
		if ( trackingCallback ) {
			trackingCallback( event, payload );
		} else {
			jetpackAnalytics.tracks.recordEvent( event, payload );
		}
	} catch {
		// Tracking must never break the notice, so a failed record is dropped.
	}
}
