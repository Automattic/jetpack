/**
 * Per-layout feature flags for the search-results block.
 *
 * One source of truth so editor preview, frontend render, and tests agree on
 * which sections each layout opts into. PHP mirrors the same map in
 * Layout_Features::for_layout (render.php).
 */

export const LAYOUTS = [ 'card', 'compact', 'product' ];

const FEATURES = {
	card: {
		modifier: 'card',
		showImage: true,
		showPath: true,
		showDate: true,
		showPrice: false,
		showRating: false,
	},
	compact: {
		modifier: 'compact',
		showImage: false,
		showPath: false,
		showDate: true,
		showPrice: false,
		showRating: false,
	},
	product: {
		modifier: 'product',
		showImage: true,
		showPath: false,
		showDate: false,
		showPrice: true,
		showRating: true,
	},
};

/**
 * Resolve the feature flags for a given layout. Unknown layouts fall back to
 * `card` so a misconfigured block never renders an empty list.
 *
 * @param {string} layout - Layout key.
 * @return {object} Feature flags.
 */
export function resolveLayout( layout ) {
	return FEATURES[ layout ] ?? FEATURES.card;
}
