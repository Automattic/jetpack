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
 * Load w.js after consent allows cookie-based Tracks.
 */
export function loadTracksScript(): void {
	if ( ! isFeatureEnabled( 'tracks' ) || document.getElementById( TRACKS_SCRIPT_ID ) ) {
		return;
	}

	const script = document.createElement( 'script' );
	script.id = TRACKS_SCRIPT_ID;
	script.src = TRACKS_SCRIPT_URL;
	script.defer = true;
	document.head.appendChild( script );
}

/**
 * Record a Tracks event via w.js
 *
 * This is the core function for sending events to Automattic Tracks.
 * Events are queued immediately and processed when w.js loads.
 * Use this directly or create wrapper functions for specific events.
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
}

/**
 * Record a Tracks event and load w.js to flush it.
 *
 * Loading w.js is a cookie-setting side effect, so the caller is responsible for
 * ensuring it is permitted at the call site: either the event documents the
 * consent decision itself (an allowlisted consent-record event) or the caller has
 * already verified analytics consent. This helper performs no consent gating of
 * its own (beyond the `features.tracks` flag honored by recordEvent/loadTracksScript).
 *
 * @param eventNameSuffix The event name (must follow Tracks naming conventions).
 * @param properties      Event properties object.
 */
export function recordEventAndLoadTracks(
	eventNameSuffix: string,
	properties: TrackingProperties
): void {
	recordEvent( eventNameSuffix, properties );
	loadTracksScript();
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
