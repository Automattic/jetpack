/**
 * Helper function to pick up the current time value,
 * from the given time value.
 *
 * @param {number|string} time - time value to check.
 * @returns {array} pair [ value, action ] array.
 */
export function pickCurrentTime( time ) {
	if ( typeof time === 'undefined' || typeof time === 'number' ) {
		return time;
	}

	const [ value, action ] = String( time ).split( /-sync-/ );
	return [ Number( value ), action.replace( /-\d+/, '' ) ];
}

/**
 * Helper function to build an action to set current position.
 *
 * @param {string} time - time value
 * @returns {string} time string with position action.
 */
export function syncCurrentTime( time ) {
	return `${ time }-sync-position-${ Date.now() }`;
}

/**
 * Helper function to build an action to set offset position.
 *
 * @param {string} offset - time value
 * @returns {string} time string with position action.
 */
export function syncOffsetTime( offset ) {
	return `${ offset }-sync-offset-${ Date.now() }`;
}
