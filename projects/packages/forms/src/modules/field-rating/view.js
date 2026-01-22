import { store, getContext, getElement } from '@wordpress/interactivity';
import { renderRatingIconsHtml } from '../../blocks/field-rating/rating-icons.js';

const NAMESPACE = 'jetpack/form';

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

store( NAMESPACE, {
	callbacks: {
		watchRatingIcons() {
			const { ref } = getElement();
			const context = getContext();

			// Try to get rating data from context (AJAX submissions) or data attribute (server-rendered).
			let rating = context.submission?.rating;

			// For server-rendered content, read rating data from data attribute.
			if ( ! rating && ref?.dataset?.rating ) {
				try {
					rating = JSON.parse( ref.dataset.rating );
				} catch {
					// Invalid JSON, ignore.
				}
			}

			// If no rating data is available, don't render icons.
			if ( ! rating ) {
				return;
			}

			const { rating: ratingValue, maxRating, iconStyle, screenReaderText } = rating;

			// Render icons using the shared function.
			ref.innerHTML = renderRatingIconsHtml( ratingValue, maxRating, iconStyle, screenReaderText );
		},
	},
} );
