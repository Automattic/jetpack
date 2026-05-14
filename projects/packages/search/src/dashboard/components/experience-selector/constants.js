import { __, _x } from '@wordpress/i18n';

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
	INLINE: 'inline',
	OFF: 'off',
} );

/**
 * Display order on the dashboard. Embedded leads (RECOMMENDED), Off comes last.
 */
export const EXPERIENCE_ORDER = [
	EXPERIENCE.EMBEDDED,
	EXPERIENCE.OVERLAY,
	EXPERIENCE.INLINE,
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
		case EXPERIENCE.INLINE:
			return __( 'Theme search', 'jetpack-search-pkg' );
		case EXPERIENCE.OFF:
			return _x( 'Off', 'Jetpack Search disabled', 'jetpack-search-pkg' );
		default:
			return '';
	}
}
