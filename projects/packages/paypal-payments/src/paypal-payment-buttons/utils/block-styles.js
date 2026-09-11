/**
 * Width, margin, border and caption styles, as inline CSS.
 *
 * The canvas and the frontend both draw from these, so a block styled in the
 * editor looks the same once published. The PHP side mirrors them in
 * PayPal_Payment_Buttons::get_wrapper_style() and ::get_caption_style() —
 * change one, change the other.
 *
 * @package
 */

/**
 * Whether a numeric attribute was actually set.
 *
 * 0 is a value a merchant can pick, so the test is for null/undefined/'' only.
 *
 * @param {*} value - The attribute value.
 * @return {boolean} True when the attribute carries a number.
 */
function isSet( value ) {
	return value !== undefined && value !== null && value !== '' && ! isNaN( value );
}

/**
 * Block wrapper styles — Width Settings and Border Settings.
 *
 * @param {object} attributes - The block attributes.
 * @return {object} A React style object, empty when nothing is configured.
 */
export function getWrapperStyle( attributes = {} ) {
	const { blockWidth, marginVertical, marginHorizontal, borderRadius, borderWidth, borderColor } =
		attributes;
	const style = {};

	if ( isSet( blockWidth ) ) {
		style.maxWidth = `${ blockWidth }%`;
	}
	if ( isSet( marginVertical ) || isSet( marginHorizontal ) ) {
		const vertical = isSet( marginVertical ) ? `${ marginVertical }px` : '0';
		const horizontal = isSet( marginHorizontal ) ? `${ marginHorizontal }px` : '0';
		style.margin = `${ vertical } ${ horizontal }`;
	}
	if ( isSet( borderRadius ) ) {
		style.borderRadius = `${ borderRadius }px`;
	}
	// A width with no colour would draw an invisible border and still take up
	// space, so both have to be present.
	if ( isSet( borderWidth ) && borderColor ) {
		style.border = `${ borderWidth }px solid ${ borderColor }`;
	}

	return style;
}

/**
 * QR caption styles — Color and Typography.
 *
 * @param {object} attributes - The block attributes.
 * @return {object} A React style object, empty when nothing is configured.
 */
export function getCaptionStyle( attributes = {} ) {
	const { captionColor, captionFontSize } = attributes;
	const style = {};

	if ( captionColor ) {
		style.color = captionColor;
	}
	if ( isSet( captionFontSize ) ) {
		style.fontSize = `${ captionFontSize }px`;
	}

	return style;
}
