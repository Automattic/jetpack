import { isAtomicSite, isSimpleSite } from './site-type-utils';

/**
 * Constants
 */
const JETPACK_GREEN_40 = '#069e08';

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
	return JETPACK_GREEN_40;
}
