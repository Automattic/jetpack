/**
 * Maximum number of rating icons to render.
 * Used to prevent DOM bloat from malformed or excessively large values.
 */
export const MAX_RATING_ICONS = 10;

/**
 * Rating icon SVG paths.
 * Single source of truth for star and heart icon paths used across the forms package.
 */
export const RATING_ICONS = {
	stars: 'M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.62L12 2 9.19 8.62 2 9.24l5.46 4.73L5.82 21z',
	hearts:
		'M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z',
};

/**
 * Render rating icons as HTML string.
 *
 * @param {number} rating           - The current rating value.
 * @param {number} maxRating        - The maximum rating value.
 * @param {string} iconStyle        - The icon style ('stars' or 'hearts').
 * @param {string} screenReaderText - Optional text for screen readers.
 * @return {string} HTML string containing SVG icons.
 */
export function renderRatingIconsHtml( rating, maxRating, iconStyle, screenReaderText = '' ) {
	const iconPath = RATING_ICONS[ iconStyle ] || RATING_ICONS.stars;

	// Add screen reader text if provided.
	let iconsHtml = screenReaderText
		? `<span class="screen-reader-text">${ screenReaderText }</span>`
		: '';

	for ( let i = 1; i <= maxRating; i++ ) {
		const filledClass = i <= rating ? 'is-filled' : '';
		iconsHtml += `<svg class="field-rating__icon ${ filledClass }" viewBox="0 0 24 24" aria-hidden="true"><path d="${ iconPath }"></path></svg>`;
	}

	return iconsHtml;
}
