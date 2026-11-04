import { wpcomTrackEvent } from '../../../common/tracks.js';
import type { MouseEvent } from 'react';

// Tracks sends its pixel with `new Image()`, which the browser cancels when the
// page unloads, so a same-tab link waits this long before following its href.
const FLUSH_MS = 250;

/**
 * Records a Tracks event.
 *
 * @param name       - Event name.
 * @param properties - Event properties.
 */
export function recordEvent( name: string, properties: Record< string, unknown > = {} ) {
	wpcomTrackEvent( name, properties );
}

/**
 * Records a click on a link, then follows it once the pixel has had time to leave.
 * Clicks that open a new tab or window go through untouched.
 *
 * @param event      - The click.
 * @param name       - Event name.
 * @param properties - Event properties.
 */
export function recordLinkClick(
	event: MouseEvent< HTMLAnchorElement >,
	name: string,
	properties: Record< string, unknown > = {}
) {
	recordEvent( name, properties );

	const { href, target } = event.currentTarget;
	// Until the Tracks client loads, `_tkq` is a plain array and nothing would send.
	const tracksActive = !! window._tkq && window._tkq.push !== Array.prototype.push;

	if (
		! tracksActive ||
		event.defaultPrevented ||
		event.button !== 0 ||
		event.metaKey ||
		event.ctrlKey ||
		event.shiftKey ||
		event.altKey ||
		( target && target !== '_self' )
	) {
		return;
	}

	event.preventDefault();
	setTimeout( () => window.location.assign( href ), FLUSH_MS );
}

declare global {
	interface Window {
		_tkq?: unknown[];
	}
}
