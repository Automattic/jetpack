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
	OVERLAY_BLOCKS: 'overlay_blocks',
	OVERLAY: 'overlay',
	INLINE: 'inline',
	OFF: 'off',
} );

/**
 * Display order on the dashboard. Embedded leads (RECOMMENDED); the new
 * blocks-powered Overlay sits where the legacy one used to so the card
 * grid layout stays stable for sites that opt in to the new flag; legacy
 * Overlay follows immediately after; Off comes last.
 *
 * `OVERLAY_BLOCKS` is filtered out at render time on sites where the
 * `jetpack_search_overlay_block_template_enabled` server flag is false,
 * so the unflagged dashboard still shows the original four cards.
 */
export const EXPERIENCE_ORDER = [
	EXPERIENCE.EMBEDDED,
	EXPERIENCE.OVERLAY_BLOCKS,
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
 * The legacy overlay carries a contextual "(legacy)" suffix only when the
 * blocks-powered overlay is also visible — see `getOverlayLabelSuffix()`.
 * Unflagged sites continue to see plain "Overlay search".
 *
 * @param {string} experience - One of the EXPERIENCE values.
 * @return {string} - Translated title.
 */
export function getExperienceLabel( experience ) {
	switch ( experience ) {
		case EXPERIENCE.EMBEDDED:
			return __( 'Embedded search', 'jetpack-search-pkg' );
		case EXPERIENCE.OVERLAY_BLOCKS:
			return __( 'Overlay search', 'jetpack-search-pkg' );
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

/**
 * Title displayed on the card.
 *
 * Identical to `getExperienceLabel()` except for the legacy overlay: when
 * the blocks-powered overlay is also on offer the two cards would
 * otherwise share the same name, so the legacy one picks up a "(legacy)"
 * suffix to disambiguate. On unflagged sites the suffix is suppressed
 * and the legacy card keeps its original title.
 *
 * @param {string}  experience          - One of the EXPERIENCE values.
 * @param {boolean} blockOverlayEnabled - True if the new overlay card is visible.
 * @return {string} - Translated title for the card.
 */
export function getCardTitle( experience, blockOverlayEnabled ) {
	if ( experience === EXPERIENCE.OVERLAY && blockOverlayEnabled ) {
		return __( 'Overlay search (legacy)', 'jetpack-search-pkg' );
	}
	return getExperienceLabel( experience );
}
