let isAnalyticsEnabled = true;
const globalProperties = {};

/**
 * Disable Analytics.
 */
export function disableAnalytics() {
	isAnalyticsEnabled = false;
}

/**
 * Initalizes Tracks.
 */
export function initializeTracks() {
	if ( isAnalyticsEnabled ) {
		window._tkq = window._tkq || [];
	}
}

/**
 * Resets current user's tracked identity.
 */
export function resetTrackingCookies() {
	isAnalyticsEnabled && window._tkq.push( [ 'clearIdentity' ] );
}

/**
 * Associates the current site with events fired in the future.
 *
 * @param {string} siteId - Current site identifier.
 */
export function identifySite( siteId ) {
	if ( isAnalyticsEnabled ) {
		globalProperties.blog_id = siteId;
	}
}

/**
 * Fires a general event to Tracks.
 *
 * @param {string} eventName - Name of the event.
 * @param {object} properties - Event properties.
 */
export function recordEvent( eventName, properties ) {
	isAnalyticsEnabled &&
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

/**
 * Fires a static filter selection event to Tracks.
 *
 * @param {object} properties - Event properties to send to Tracks.
 */
export function recordStaticFilterSelect( properties ) {
	recordEvent( 'jetpack_instant_search_static_filter_select', properties );
}
