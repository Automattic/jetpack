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
 * Display order on the dashboard. Embedded leads (BETA), then the
 * preact Overlay (the mature choice), then the blocks-powered Overlay
 * (BETA) as a sibling — both overlays are first-class peers, not
 * predecessor/successor. Theme search, then Off, follow.
 *
 * The blocks-powered Overlay card intentionally sits *after* the preact
 * one so the visual hierarchy doesn't push site owners toward the
 * not-yet-mature path.
 *
 * `OVERLAY_BLOCKS` is filtered out at render time on sites where the
 * `jetpack_search_overlay_block_template_enabled` server flag is pinned
 * to false. The default is true, so the BETA card ships to every site
 * unless an operator opts the site out.
 */
export const EXPERIENCE_ORDER = [
	EXPERIENCE.EMBEDDED,
	EXPERIENCE.OVERLAY,
	EXPERIENCE.OVERLAY_BLOCKS,
	EXPERIENCE.INLINE,
	EXPERIENCE.OFF,
];

/**
 * Get the human-readable title for an experience.
 *
 * Wrapped in a function so __() runs at render time (i18n is locale-aware
 * after the dashboard boots, not at module-load time).
 *
 * The blocks-powered overlay carries a "(blocks)" suffix so site owners
 * can tell the two coexisting overlays apart at a glance. The preact
 * Overlay keeps its plain title — neither card supersedes the other.
 *
 * @param {string} experience - One of the EXPERIENCE values.
 * @return {string} - Translated title.
 */
export function getExperienceLabel( experience ) {
	switch ( experience ) {
		case EXPERIENCE.EMBEDDED:
			return __( 'Embedded search', 'jetpack-search-pkg' );
		case EXPERIENCE.OVERLAY_BLOCKS:
			return __( 'Overlay search (blocks)', 'jetpack-search-pkg' );
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
 * Currently identical to `getExperienceLabel()`. Kept as a separate entry
 * point so callers that want the card-level title (vs. an inline mention
 * elsewhere in the UI) don't reach through to the label fn directly —
 * leaves room to context-sensitively decorate the card title later
 * without rippling through every callsite.
 *
 * @param {string} experience - One of the EXPERIENCE values.
 * @return {string} - Translated title for the card.
 */
export function getCardTitle( experience ) {
	return getExperienceLabel( experience );
}
