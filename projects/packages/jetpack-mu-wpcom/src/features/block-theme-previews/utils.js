import { getQueryArg } from '@wordpress/url';

/**
 * Returns the theme stylesheet of the currently previewed theme.
 *
 * @return {string} The query arg.
 */
export function getPreviewedThemeStylesheet() {
	return getQueryArg( window.location.href, 'wp_theme_preview' );
}
