import colorStudio from '@automattic/color-studio';
import { isWpcomPlatformSite } from '@automattic/jetpack-script-data';

/**
 * Constants
 */
const PALETTE = colorStudio.colors;
const COLOR_JETPACK = PALETTE[ 'Jetpack Green 40' ];

/**
 * Returns the icon color for Jetpack blocks.
 *
 * Green in the Jetpack context, otherwise black for Simple sites or Atomic sites.
 *
 * @return {string} HEX color for block editor icons
 */
export function getIconColor() {
	if ( isWpcomPlatformSite() ) {
		// Return null to match core block styling
		return null;
	}

	// Jetpack Green
	return COLOR_JETPACK;
}
