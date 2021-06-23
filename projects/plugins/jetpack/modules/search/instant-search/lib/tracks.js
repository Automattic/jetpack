const globalProperties = {};

export function initializeTracks() {
	window._tkq = window._tkq || [];
}
export function resetTrackingCookies() {
	window._tkq.push( [ 'clearIdentity' ] );
}

export function identifySite( siteId ) {
	globalProperties.blog_id = siteId;
}

export function recordEvent( eventName, properties ) {
	window._tkq.push( [ 'recordEvent', eventName, { ...globalProperties, ...properties } ] );
}

export function recordTrainTracksRender( properties ) {
	recordEvent( 'jetpack_instant_search_traintracks_render', properties );
}

export function recordTrainTracksInteract( properties ) {
	recordEvent( 'jetpack_instant_search_traintracks_interact', properties );
}

/**
 * Fires a static filter selection event to Tracks.
 *
 * @param {object} properties - Event properties to send to Tracks.
 */
export function recordStaticFilterSelect( properties ) {
	recordEvent( 'jetpack_instant_search_static_filter_select', properties );
}
