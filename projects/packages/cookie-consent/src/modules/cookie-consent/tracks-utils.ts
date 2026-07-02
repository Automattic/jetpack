/**
 * Tracks Utilities
 *
 * Core w.js integration utilities. Can be extracted to a separate package for use across multiple packages.
 */

import { isFeatureEnabled } from './features';
import type { TrackingProperties } from './types';

const TRACKS_SCRIPT_ID = 'jetpack-cookie-consent-tracks-js';
const TRACKS_SCRIPT_URL = 'https://stats.wp.com/w.js';
const COOKIELESS_PIXEL_URL = 'https://pixel.wp.com/g.gif';
const COOKIELESS_STAT_PREFIX = 'x_jetpack-cookie-consent';
const WEEK_IN_MS = 6.048e8;

/**
 * Extract UTM parameters from URL
 *
 * @param url Optional URL to parse (defaults to current location)
 * @return Object containing UTM parameters (empty object if URL is invalid)
 */
export function getUtmParameters( url: string = window.location.href ): Record< string, string > {
	const utmParams: Record< string, string > = {};

	try {
		const urlParams = new URLSearchParams( new URL( url ).search );

		const utmKeys = [ 'utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content' ];

		utmKeys.forEach( key => {
			const value = urlParams.get( key );
			if ( value ) {
				utmParams[ key ] = value;
			}
		} );
	} catch {
		// If the URL is invalid, return an empty object
		return utmParams;
	}

	return utmParams;
}

/**
 * Get common tracking properties (path, domain, UTM params).
 *
 * @return Object with common tracking properties
 */
export function getCommonProperties(): TrackingProperties {
	const utmParams = getUtmParameters();

	return {
		path: window.location.pathname,
		domain: window.location.hostname,
		...utmParams,
	};
}

/**
 * Ensure w.js tracking queue is initialized.
 *
 * Creates the window._tkq array if it doesn't exist.
 * Events are queued and will be processed when w.js loads.
 */
export function ensureTrackingQueue(): void {
	if ( ! window._tkq ) {
		window._tkq = [];
	}
}

/**
 * Ensure w.js is loaded so queued cookie-based Tracks events can flush.
 *
 * Idempotent: injects the loader at most once (guarded by its script id) and
 * no-ops when Tracks is disabled or the script is already present, so callers can
 * safely invoke it on every consent-allowed event.
 */
export function ensureTracksLoaded(): void {
	if ( ! isFeatureEnabled( 'tracks' ) || document.getElementById( TRACKS_SCRIPT_ID ) ) {
		return;
	}

	// Weekly cache-buster, matching the `?ver=gmdate('YW')` the PHP enqueue used to
	// apply, so a stale w.js can't be served from cache for more than a week.
	const url = new URL( TRACKS_SCRIPT_URL );
	url.searchParams.set( 'ver', String( Math.floor( Date.now() / WEEK_IN_MS ) ) );

	const script = document.createElement( 'script' );
	script.id = TRACKS_SCRIPT_ID;
	script.src = url.toString();
	script.defer = true;
	document.head.appendChild( script );
}

/**
 * Record a cookie-based Tracks event via w.js.
 *
 * The event is queued and w.js is loaded (idempotently) to flush the queue — a
 * queued event never sends on its own, so recording inherently loads the loader.
 * Callers must ensure loading w.js is permitted: the event either documents the
 * consent decision itself (allowlisted) or the caller has verified analytics
 * consent. The whole call no-ops when the `features.tracks` flag is off.
 *
 * @param eventNameSuffix The event name (must follow Tracks naming conventions).
 * @param properties      Event properties object.
 */
export function recordEvent( eventNameSuffix: string, properties: TrackingProperties ): void {
	if ( ! isFeatureEnabled( 'tracks' ) ) {
		return;
	}

	const eventNamePrefix = window.jetpackCookieConsentConfig?.eventPrefix || 'jetpack';
	const eventName = `${ eventNamePrefix }_${ eventNameSuffix }`;
	// Ensure queue exists - w.js will process events when it loads
	ensureTrackingQueue();

	// Queue the event
	window._tkq!.push( [ 'recordEvent', eventName, properties ] );

	// A queued event only sends once w.js loads to drain the queue.
	ensureTracksLoaded();
}

/**
 * Record an identity-free aggregate stat via g.gif.
 *
 * @param statName Stat name suffix.
 */
export function recordCookielessStat( statName: string ): void {
	const statKey = `${ COOKIELESS_STAT_PREFIX }-${ statName }`;
	const statValue = `total,${ window.location.hostname }`;
	const cacheBuster = `${ Date.now() }-${ Math.random().toString( 36 ).slice( 2 ) }`;
	const url = new URL( COOKIELESS_PIXEL_URL );

	url.searchParams.set( 'v', 'wpcom-no-pv' );
	url.searchParams.set( statKey, statValue );
	url.searchParams.set( 'r', cacheBuster );

	new Image().src = url.toString();
}
