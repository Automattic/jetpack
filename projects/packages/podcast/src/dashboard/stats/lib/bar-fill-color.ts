// Mirrors the SCSS rule in ../style.scss: Studio Blue for the wp-admin Fresh
// default and non-wp-admin contexts (Calypso), otherwise follow the user's
// chosen admin scheme via --wp-admin-theme-color. Needed because BarChart paints
// SVG directly and can't read CSS custom properties the way the bar lists do.

const STUDIO_BLUE = '#3858e9';

export function getPodcastStatsBarFill(): string {
	if ( typeof document === 'undefined' ) {
		return STUDIO_BLUE;
	}

	if ( document.body.classList.contains( 'admin-color-fresh' ) ) {
		return STUDIO_BLUE;
	}

	const resolved = getComputedStyle( document.body )
		.getPropertyValue( '--wp-admin-theme-color' )
		.trim();
	return resolved || STUDIO_BLUE;
}
