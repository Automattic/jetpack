import colorStudio from '@automattic/color-studio';
import { isAtomicSite, isSimpleSite } from '@automattic/jetpack-shared-extension-utils';
import { SVG } from '@wordpress/components';

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
	if ( isAtomicSite() || isSimpleSite() ) {
		// Return null to match core block styling
		return null;
	}

	// Jetpack Green
	return COLOR_JETPACK;
}

export function MaterialIcon( { children, width = 24, height = 24, viewbox = '0 0 24 24' } ) {
	return (
		<SVG xmlns="http://www.w3.org/2000/svg" width={ width } height={ height } viewBox={ viewbox }>
			{ children }
		</SVG>
	);
}
