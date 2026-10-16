import analytics from '@automattic/jetpack-analytics';

/**
 * Default properties attached to every Tracks event this feature records.
 *
 * `is_a11n` marks internal traffic so Automattician testing can be filtered out
 * of product reporting. Read at call time rather than at module load: the inline
 * script defining the global runs before the bundle, but reading lazily keeps
 * this module importable in tests that never define it.
 *
 * @return {Object} Properties merged into every recorded event, before any
 *                   explicitly passed by the caller.
 */
function getDefaultProperties() {
	return {
		is_a11n: !! window.jetpackContentGuidelinesAi?.isA11n,
	};
}

/**
 * Record a content guidelines Tracks event.
 *
 * @param {string} eventName  - Event name suffix (appended to `jetpack_ai_guidelines_`).
 * @param {Object} properties - Event properties.
 */
export function recordGuidelinesEvent( eventName, properties = {} ) {
	analytics.tracks.recordEvent( `jetpack_ai_guidelines_${ eventName }`, {
		...getDefaultProperties(),
		...properties,
	} );
}

/**
 * Record a generic Jetpack AI Tracks event.
 * Use for shared events like `jetpack_ai_upgrade_button`.
 *
 * @param {string} eventName  - Full event name.
 * @param {Object} properties - Event properties.
 */
export function recordAiEvent( eventName, properties = {} ) {
	analytics.tracks.recordEvent( eventName, {
		...getDefaultProperties(),
		...properties,
	} );
}
