// Resolve the chart-bar color for the Downloads chart. Mirrors the SCSS rule
// in ../style.scss: use Studio Blue for the wp-admin Fresh default (and any
// non-wp-admin context), otherwise follow the user's chosen admin scheme via
// --wp-admin-theme-color so the chart matches the horizontal bar lists.

const STUDIO_BLUE = '#3858e9';

export function getPodcastStatsBarFill(): string {
	if ( typeof document === 'undefined' ) {
		return STUDIO_BLUE;
	}

	const body = document.body;
	const hasAdminScheme = /\badmin-color-/.test( body.className );

	if ( ! hasAdminScheme || body.classList.contains( 'admin-color-fresh' ) ) {
		return STUDIO_BLUE;
	}

	const resolved = getComputedStyle( body ).getPropertyValue( '--wp-admin-theme-color' ).trim();
	return resolved || STUDIO_BLUE;
}
