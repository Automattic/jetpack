import analytics from '@automattic/jetpack-analytics';

/**
 * Record a content guidelines Tracks event.
 *
 * @param {string} eventName  - Event name suffix (appended to `jetpack_ai_guidelines_`).
 * @param {Object} properties - Event properties.
 */
export function recordGuidelinesEvent( eventName, properties = {} ) {
	analytics.tracks.recordEvent( `jetpack_ai_guidelines_${ eventName }`, properties );
}

/**
 * Record a generic Jetpack AI Tracks event.
 * Use for shared events like `jetpack_ai_upgrade_button`.
 *
 * @param {string} eventName  - Full event name.
 * @param {Object} properties - Event properties.
 */
export function recordAiEvent( eventName, properties = {} ) {
	analytics.tracks.recordEvent( eventName, properties );
}
