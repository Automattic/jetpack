/**
 * Tracks Utilities
 *
 * Core w.js integration utilities. Can be extracted to a separate package for use across multiple packages.
 */

import type { TrackingProperties } from './types';

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
	const eventNamePrefix = window.jetpackCookieConsentConfig?.eventPrefix || 'jetpack';
	const eventName = `${ eventNamePrefix }_${ eventNameSuffix }`;
	// Ensure queue exists - w.js will process events when it loads
	ensureTrackingQueue();

	// Queue the event
	window._tkq!.push( [ 'recordEvent', eventName, properties ] );
}
