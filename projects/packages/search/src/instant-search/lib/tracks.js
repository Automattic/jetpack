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
 *
 * @param {boolean} forceEnableAnalytics - Forcibly enable analytics, ignoring the isAnalyticsEnabled flag.
 */
export function initializeTracks( forceEnableAnalytics = false ) {
	if ( forceEnableAnalytics || isAnalyticsEnabled ) {
		window._tkq = window._tkq || [];
	}
}

/**
 * Resets current user's tracked identity.
 *
 * @param {boolean} forceEnableAnalytics - Forcibly enable analytics, ignoring the isAnalyticsEnabled flag.
 */
export function resetTrackingCookies( forceEnableAnalytics = false ) {
	( forceEnableAnalytics || isAnalyticsEnabled ) && window._tkq.push( [ 'clearIdentity' ] );
}

/**
 * Associates the current site with events fired in the future.
 *
 * @param {number|string} siteId - Current site identifier.
 * @param {boolean} forceEnableAnalytics - Forcibly enable analytics, ignoring the isAnalyticsEnabled flag.
 */
export function identifySite( siteId, forceEnableAnalytics = false ) {
	if ( forceEnableAnalytics || isAnalyticsEnabled ) {
		globalProperties.blog_id = siteId;
	}
}

/**
 * Fires a general event to Tracks.
 *
 * @param {string} eventName - Name of the event.
 * @param {object} properties - Event properties.
 * @param {boolean} forceEnableAnalytics - Forcibly enable analytics, ignoring the isAnalyticsEnabled flag.
 */
export function recordEvent( eventName, properties, forceEnableAnalytics = false ) {
	( forceEnableAnalytics || isAnalyticsEnabled ) &&
		window._tkq.push( [ 'recordEvent', eventName, { ...globalProperties, ...properties } ] );
}

/**
 * Fires a TrainTracks render event to Tracks.
 *
 * @param {object} properties - Event properties.
 * @param {boolean} forceEnableAnalytics - Forcibly enable analytics, ignoring the isAnalyticsEnabled flag.
 */
export function recordTrainTracksRender( properties, forceEnableAnalytics = false ) {
	recordEvent( 'jetpack_instant_search_traintracks_render', properties, forceEnableAnalytics );
}

/**
 * Fires a TrainTracks interaction event to Tracks.
 *
 * @param {object} properties - Event properties.
 * @param {boolean} forceEnableAnalytics - Forcibly enable analytics, ignoring the isAnalyticsEnabled flag.
 */
export function recordTrainTracksInteract( properties, forceEnableAnalytics = false ) {
	recordEvent( 'jetpack_instant_search_traintracks_interact', properties, forceEnableAnalytics );
}

/**
 * Fires a static filter selection event to Tracks.
 *
 * @param {object} properties - Event properties to send to Tracks.
 * @param {boolean} forceEnableAnalytics - Forcibly enable analytics, ignoring the isAnalyticsEnabled flag.
 */
export function recordStaticFilterSelect( properties, forceEnableAnalytics = false ) {
	recordEvent( 'jetpack_instant_search_static_filter_select', properties, forceEnableAnalytics );
}
