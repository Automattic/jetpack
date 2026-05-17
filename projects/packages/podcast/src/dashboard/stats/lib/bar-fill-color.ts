// Mirrors the SCSS rule in ../style.scss: Studio Blue for the wp-admin Fresh
// default and non-wp-admin contexts (Calypso), otherwise follow the user's
// chosen admin scheme via --wp-admin-theme-color. Needed because BarChart paints
// SVG directly and can't read CSS custom properties the way the bar lists do.

const STUDIO_BLUE = '#3858e9';

/**
 * Resolve the stats bar fill color for the active admin color scheme.
 *
 * @return Hex string for charts that paint SVG directly.
 */
export function getPodcastStatsBarFill(): string {
	if ( typeof document === 'undefined' ) {
		return STUDIO_BLUE;
	}

	const body = document.body;
	const hasAdminScheme = /\badmin-color-/.test( body.className );

	// Mirror the SCSS guard: contexts with no admin-color-* class (e.g. Calypso)
	// always get Studio Blue, even if --wp-admin-theme-color is set on body.
	if ( ! hasAdminScheme || body.classList.contains( 'admin-color-fresh' ) ) {
		return STUDIO_BLUE;
	}

	const resolved = getComputedStyle( body ).getPropertyValue( '--wp-admin-theme-color' ).trim();
	return resolved || STUDIO_BLUE;
}
