/**
 * Internal dependencies
 */
import { isAtomicSite, isSimpleSite } from './site-type-utils';

/**
 * Returns the icon color for Jetpack blocks.
 *
 * Green in the Jetpack context, otherwise black for Simple sites or Atomic sites.
 *
 * @return {string} HEX color for block editor icons
 */
export function getIconColor() {
	if ( isAtomicSite() || isSimpleSite() ) {
		return '#1e1e1e'; // Default Gutenberg G2 Black
	}

	return '#00be28'; // Jetpack Green
}
