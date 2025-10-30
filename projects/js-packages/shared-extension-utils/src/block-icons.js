import { accentColour } from '@automattic/jetpack-script-data';

/**
 * Returns the icon color for Jetpack blocks.
 *
 * Green in the Jetpack context, otherwise black for Simple sites or Atomic sites.
 *
 * @return {string} HEX color for block editor icons
 */
export function getIconColor() {
	return accentColour();
}
