import { store, getContext, getElement } from '@wordpress/interactivity';
import { renderRatingIconsHtml } from '../../blocks/field-rating/rating-icons.js';
// Re-export helpers for use by other modules.
export { getRating, isRatingValue, getRatingDisplayValue } from './helpers.js';

const NAMESPACE = 'jetpack/form';

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
