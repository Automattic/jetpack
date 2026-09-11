/**
 * Width, margin, border and caption styles, as inline CSS.
 *
 * The editor canvas draws from these; PayPal_Payment_Buttons::get_wrapper_style()
 * and ::get_caption_style() mirror them for the published page, and both put the
 * result on the same element. Change one, change the other.
 *
 * @package
 */

// Mirrors PayPal_Payment_Buttons::sanitize_css_color(). The palette can hand
// back a value PHP will not emit, and a color that renders in the editor and
// vanishes on the published page is the bug this whole milestone exists to fix.
const HEX = /^#([0-9a-f]{3}|[0-9a-f]{6}|[0-9a-f]{8})$/i;
const PRESET_VAR = /^var\(--wp--[a-z0-9-]+\)$/i;

/**
 * Accept only a color the published page will also emit.
 *
 * @param {string} color - The raw attribute value.
 * @return {string} The color, or '' when PHP would drop it.
 */
function usableColor( color ) {
	const value = `${ color ?? '' }`.trim();

	return HEX.test( value ) || PRESET_VAR.test( value ) ? value : '';
}

/**
 * Block wrapper styles — Width Settings and Border Settings.
 *
 * @param {object} attributes - The block attributes.
 * @return {object} A React style object, empty when nothing is configured.
 */
export function getWrapperStyle( attributes = {} ) {
	const {
		blockWidth,
		marginVertical,
		marginHorizontal,
		blockBorderRadius,
		blockBorderWidth,
		blockBorderColor,
	} = attributes;
	const style = {};

	// Width carries its own unit, so it goes through as typed.
	if ( blockWidth ) {
		style.maxWidth = blockWidth;
	}

	// 0 is a margin a merchant can pick, so the test is for a number, not truth.
	if ( Number.isFinite( marginVertical ) || Number.isFinite( marginHorizontal ) ) {
		const vertical = Number.isFinite( marginVertical ) ? `${ marginVertical }px` : '0';
		const horizontal = Number.isFinite( marginHorizontal ) ? `${ marginHorizontal }px` : '0';
		style.margin = `${ vertical } ${ horizontal }`;
	}

	if ( Number.isFinite( blockBorderRadius ) ) {
		style.borderRadius = `${ blockBorderRadius }px`;
	}

	// A width with no color would fall back to currentColor and draw a border
	// the merchant never chose, so emit one only when both halves are set.
	const borderColor = usableColor( blockBorderColor );
	if ( Number.isFinite( blockBorderWidth ) && borderColor ) {
		style.border = `${ blockBorderWidth }px solid ${ borderColor }`;
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

	const color = usableColor( captionColor );
	if ( color ) {
		style.color = color;
	}
	if ( Number.isFinite( captionFontSize ) ) {
		style.fontSize = `${ captionFontSize }px`;
	}

	return style;
}
