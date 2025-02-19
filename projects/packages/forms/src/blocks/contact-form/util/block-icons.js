import colorStudio from '@automattic/color-studio';
import { isAtomicSite, isSimpleSite } from '@automattic/jetpack-shared-extension-utils';
import { SVG } from '@wordpress/components';
import { Path } from '@wordpress/primitives';

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

// TODO: Eventually remove `renderMaterialIcon` in favor of this component.
function MaterialIcon( { children, width = 24, height = 24, viewbox = '0 0 24 24' } ) {
	return (
		<SVG xmlns="http://www.w3.org/2000/svg" width={ width } height={ height } viewBox={ viewbox }>
			{ children }
		</SVG>
	);
}

export const fieldTextBlockIcon = (
	<MaterialIcon>
		<Path d="M12 7H4V8.5H12V7ZM19.75 17.25V10.75H4.25V17.25H19.75ZM5.75 15.75V12.25H18.25V15.75H5.75Z" />
	</MaterialIcon>
);
