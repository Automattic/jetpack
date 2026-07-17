/**
 * Pure helper functions for rating field.
 * Extracted to allow testing without Interactivity API dependencies.
 */

/**
 * Extract rating data from a field value.
 *
 * @param {object} value - The field value.
 * @return {Object|null} Rating data object or null if not a rating field.
 */
export function getRating( value ) {
	if ( value?.type === 'rating' ) {
		return {
			rating: value.rating ?? 0,
			maxRating: value.maxRating ?? 5,
			iconStyle: value.iconStyle ?? 'stars',
		};
	}

	return null;
}

/**
 * Check if a value is a rating field value.
 *
 * @param {object} value - The field value.
 * @return {boolean} True if this is a rating field value.
 */
export function isRatingValue( value ) {
	return value?.type === 'rating';
}

/**
 * Get the display value for a rating field.
 *
 * @param {object} value - The field value.
 * @return {string|null} The display value (e.g., "3/5") or null if not a rating.
 */
export function getRatingDisplayValue( value ) {
	if ( isRatingValue( value ) && value?.displayValue ) {
		return value.displayValue;
	}
	return null;
}
