import analytics from '@automattic/jetpack-analytics';

const { recordEvent } = analytics.tracks;

const SUBSCRIBE_ORIGIN = 'https://subscribe.wordpress.com';

const fallbackId = () =>
	`${ Math.random().toString( 36 ).slice( 2 ) }${ Date.now().toString( 36 ) }`;

/**
 * Generate a UUID for grouping events emitted in a single donation attempt
 * (form_viewed → amount_selected → checkout_opened → checkout_dismissed).
 *
 * @return {string} A session identifier scoped to one donation form interaction.
 */
export function generateDonationSessionId() {
	if ( typeof globalThis.crypto?.randomUUID === 'function' ) {
		return globalThis.crypto.randomUUID();
	}
	return fallbackId();
}

/**
 * Record a Tracks event for the donations block frontend.
 *
 * `blog_id` is auto-attached by `@automattic/jetpack-analytics` via
 * `window.jpTracksContext`. The donations frontend runs on the published page
 * (donor context, not editor), so user identity is intentionally not added.
 *
 * @param {string} name  - Event name. Must start with `jetpack_donations_`.
 * @param {object} props - Per-event properties.
 */
export function recordDonationsEvent( name, props = {} ) {
	recordEvent( name, {
		surface: 'post_content',
		...props,
	} );
}

/**
 * Subscribe to the postMessage stream from the wpcom-hosted memberships iframe
 * and fire `jetpack_donations_checkout_dismissed` when the user aborts without
 * a JWT token (Stripe failure or deliberate close).
 *
 * Successful checkouts trigger a page reload before any post-success event
 * could fire reliably, so successes are inferred analytically as
 * `checkout_opened − checkout_dismissed`. This is documented in the event's
 * registration so analysts know to compute completion that way.
 *
 * @param {() => object} getProps - Lazy supplier of per-event properties (called at message time so the latest amount/frequency are captured).
 * @return {() => void} Detach function that removes the listener.
 */
export function listenForCheckoutDismissal( getProps ) {
	let sawJwt = false;

	const handler = event => {
		if ( event.origin !== SUBSCRIBE_ORIGIN || ! event.data ) {
			return;
		}
		let data = event.data;
		if ( typeof data === 'string' ) {
			try {
				data = JSON.parse( data );
			} catch {
				return;
			}
		}
		if ( data?.result?.jwt_token ) {
			sawJwt = true;
			return;
		}
		if ( data?.action === 'close' && ! sawJwt ) {
			recordDonationsEvent( 'jetpack_donations_checkout_dismissed', {
				...getProps(),
				had_jwt_token: false,
			} );
		}
	};

	window.addEventListener( 'message', handler, false );
	return () => window.removeEventListener( 'message', handler, false );
}
