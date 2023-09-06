import colorStudio from '@automattic/color-studio';
import { isAtomicSite, isSimpleSite } from './site-type-utils';

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
 * @returns {string} HEX color for block editor icons
 */
export default function getIconColor() {
	if ( isAtomicSite() || isSimpleSite() ) {
		// Return null to match core block styling
		return null;
	}

	// Jetpack Green
	return COLOR_JETPACK;
}
