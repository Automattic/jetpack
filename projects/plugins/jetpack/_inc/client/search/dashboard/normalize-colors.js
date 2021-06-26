/**
 * Normalizes arbitrary strings into 6 digit color hex strings.
 *
 * @param {string} colorText - Color text.
 * @param {string} defaultColor - Default color text for unrecognized colorText inputs.
 * @returns {string} Normalized color hex with prepended #.
 */
export default function normalizeColors( colorText, defaultColor = '#FFFFFF' ) {
	if ( typeof colorText !== 'string' ) {
		return defaultColor;
	}

	if ( colorText[ 0 ] !== '#' ) {
		colorText = `#${ colorText }`;
	}

	if ( colorText.length !== 4 && colorText.length !== 7 ) {
		return defaultColor;
	}

	if ( colorText.length === 4 ) {
		return `#${ colorText[ 1 ] }${ colorText[ 1 ] }${ colorText[ 2 ] }${ colorText[ 2 ] }${ colorText[ 3 ] }${ colorText[ 3 ] }`;
	}

	return colorText;
}
