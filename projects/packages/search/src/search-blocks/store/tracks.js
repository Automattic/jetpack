/**
 * TrainTracks analytics for the Search Blocks path. Mirrors the relevant slice
 * of `instant-search/lib/tracks.js` (render + interact only) so blocks
 * engagement feeds the same search-relevance pipeline, but stays free of the
 * calypso dependencies that bundle pulls in — the blocks view bundle is
 * size-guarded (see AGENTS.md § Shared store / bundles).
 *
 * Events are pushed onto `window._tkq`; the WordPress.com stats script flushes
 * the queue if/when it loads, and the push is a harmless no-op otherwise —
 * exactly how instant search behaves.
 */

const globalProperties = {};

/**
 * Associates the current site with events fired in the future.
 *
 * @param {number|string} siteId - Current site identifier.
 */
export function identifySite( siteId ) {
	globalProperties.blog_id = siteId;
}

/**
 * Fires a general event to Tracks.
 *
 * @param {string} eventName  - Name of the event.
 * @param {object} properties - Event properties.
 */
function recordEvent( eventName, properties ) {
	window._tkq = window._tkq || [];
	window._tkq.push( [ 'recordEvent', eventName, { ...globalProperties, ...properties } ] );
}

/**
 * Fires a TrainTracks render event to Tracks.
 *
 * @param {object} properties - Event properties.
 */
export function recordTrainTracksRender( properties ) {
	recordEvent( 'jetpack_instant_search_traintracks_render', properties );
}

/**
 * Fires a TrainTracks interaction event to Tracks.
 *
 * @param {object} properties - Event properties.
 */
export function recordTrainTracksInteract( properties ) {
	recordEvent( 'jetpack_instant_search_traintracks_interact', properties );
}
