import { __, _x } from '@wordpress/i18n';
import { grid, navigationOverlay, published, cancelCircleFilled } from '@wordpress/icons';

/**
 * Experience IDs.
 *
 * Sent to the back end as `{ experience }`. The whole UI is gated behind
 * `jetpack_search_blocks_enabled`, so front and back ship together — there
 * is no need to also send the legacy `module_active` / `instant_search_enabled`
 * booleans. The back end translates `experience` into whatever it persists,
 * and migrates any pre-existing booleans on first read so the initial active
 * row reflects the user's prior state.
 */
export const EXPERIENCE = Object.freeze( {
	EMBEDDED: 'embedded',
	OVERLAY: 'overlay',
	CLASSIC: 'classic',
	OFF: 'off',
} );

/**
 * Display order on the dashboard. Embedded leads (RECOMMENDED), Off comes last.
 */
export const EXPERIENCE_ORDER = [
	EXPERIENCE.EMBEDDED,
	EXPERIENCE.OVERLAY,
	EXPERIENCE.CLASSIC,
	EXPERIENCE.OFF,
];

/**
 * Get the human-readable title for an experience.
 *
 * Wrapped in a function so __() runs at render time (i18n is locale-aware
 * after the dashboard boots, not at module-load time).
 *
 * @param {string} experience - One of the EXPERIENCE values.
 * @return {string} - Translated title.
 */
export function getExperienceLabel( experience ) {
	switch ( experience ) {
		case EXPERIENCE.EMBEDDED:
			return __( 'Embedded search', 'jetpack-search-pkg' );
		case EXPERIENCE.OVERLAY:
			return __( 'Overlay search', 'jetpack-search-pkg' );
		case EXPERIENCE.CLASSIC:
			return __( 'Theme search', 'jetpack-search-pkg' );
		case EXPERIENCE.OFF:
			return _x( 'Off', 'Jetpack Search disabled', 'jetpack-search-pkg' );
		default:
			return '';
	}
}

/**
 * Get the human-readable description for an experience.
 *
 * Note: The Overlay description deliberately references "Instant Search" —
 * the older marketing name — so existing users connect the two.
 *
 * @param {string} experience - One of the EXPERIENCE values.
 * @return {string} - Translated description.
 */
export function getExperienceDescription( experience ) {
	switch ( experience ) {
		case EXPERIENCE.EMBEDDED:
			return __(
				'A search-as-you-type customizable search page built with blocks.',
				'jetpack-search-pkg'
			);
		case EXPERIENCE.OVERLAY:
			return __( 'A search-as-you-type overlay (formerly Instant Search).', 'jetpack-search-pkg' );
		case EXPERIENCE.CLASSIC:
			return __( "Your theme's search layout, with faster results.", 'jetpack-search-pkg' );
		case EXPERIENCE.OFF:
			return __( 'WordPress default search.', 'jetpack-search-pkg' );
		default:
			return '';
	}
}

/**
 * Get the icon component for an experience.
 *
 * @param {string} experience - One of the EXPERIENCE values.
 * @return {object} - A `@wordpress/icons` icon definition.
 */
export function getExperienceIcon( experience ) {
	switch ( experience ) {
		case EXPERIENCE.EMBEDDED:
			return grid;
		case EXPERIENCE.OVERLAY:
			return navigationOverlay;
		case EXPERIENCE.CLASSIC:
			return published;
		case EXPERIENCE.OFF:
			return cancelCircleFilled;
		default:
			return null;
	}
}
