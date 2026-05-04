import { __, _x } from '@wordpress/i18n';
import { grid, desktop, search, cancelCircleFilled } from '@wordpress/icons';

/**
 * Experience IDs.
 *
 * - 'embedded' and 'overlay' are persisted server-side once the back end
 * ships the feature (today they are written but ignored).
 * - 'classic' and 'off' are synthetic UI tokens; the back end sees them as
 * boolean combinations of `module_active` and `instant_search_enabled`.
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
			return __( 'Embedded Search', 'jetpack-search-pkg' );
		case EXPERIENCE.OVERLAY:
			return __( 'Overlay Search', 'jetpack-search-pkg' );
		case EXPERIENCE.CLASSIC:
			return __( 'Faster results', 'jetpack-search-pkg' );
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
			return __( 'A custom search page built with blocks.', 'jetpack-search-pkg' );
		case EXPERIENCE.OVERLAY:
			return __( 'A search-as-you-type overlay (formerly Instant Search).', 'jetpack-search-pkg' );
		case EXPERIENCE.CLASSIC:
			return __( 'Same theme layout, faster results.', 'jetpack-search-pkg' );
		case EXPERIENCE.OFF:
			return __( "Use WordPress's default search.", 'jetpack-search-pkg' );
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
			return desktop;
		case EXPERIENCE.CLASSIC:
			return search;
		case EXPERIENCE.OFF:
			return cancelCircleFilled;
		default:
			return null;
	}
}
