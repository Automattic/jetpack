/**
 * Utility functions for rating field components
 */

/**
 * Updates className by replacing any existing style variation with a new one.
 *
 * @param {string} currentClassName - Current className string
 * @param {string} newVariation     - New style variation (e.g., 'stars', 'hearts')
 * @return {string} Updated className string
 */
export const updateClassNameWithVariation = ( currentClassName = '', newVariation ) => {
	const cleanedClassName = currentClassName.replace( /is-style-[^\s]+/g, '' ).trim();
	const newClassName = `${ cleanedClassName } is-style-${ newVariation }`.trim();
	return newClassName;
};

/**
 * Validates rating values to ensure they're within acceptable bounds.
 *
 * @param {number} value - Value to validate
 * @param {number} min   - Minimum allowed value
 * @param {number} max   - Maximum allowed value
 * @return {number} Clamped value within bounds
 */
export const validateRatingValue = ( value, min = 0, max = 10 ) => {
	if ( typeof value !== 'number' || isNaN( value ) ) {
		return min;
	}
	return Math.max( min, Math.min( max, value ) );
};

/**
 * Validates max rating value to ensure it's within acceptable bounds.
 *
 * @param {number} maxValue - Maximum rating value to validate
 * @return {number} Validated max value between 2 and 10
 */
export const validateMaxRating = maxValue => {
	return validateRatingValue( maxValue, 2, 10 );
};
