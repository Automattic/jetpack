/**
 * Width, margin, border and caption styles for the editor canvas.
 *
 * Margin and border live in `attributes.style`, the same shape core's block
 * supports use, so core's own helpers turn them into CSS — the JS twin of the
 * wp_style_engine_get_styles() call the published page makes. Using them rather
 * than assembling declarations here is what keeps the canvas and the published
 * page from drifting: preset expansion, longhand names and which sides are
 * emitted all come from one implementation.
 *
 * The values are validated the same way first. The published page refuses
 * anything its sanitizers do not recognise, so a block whose attributes were
 * hand-edited in code view has to be refused here too — otherwise it renders in
 * the editor and vanishes on publish. tests/fixtures/style-parity.json holds the
 * cases both sides are checked against.
 *
 * @package
 */

import {
	__experimentalGetBorderClassesAndStyles as getBorderClassesAndStyles, // eslint-disable-line @wordpress/no-unsafe-wp-apis
	__experimentalGetSpacingClassesAndStyles as getSpacingClassesAndStyles, // eslint-disable-line @wordpress/no-unsafe-wp-apis
} from '@wordpress/block-editor';

// Mirrors sanitize_css_length(), sanitize_css_color() and
// sanitize_css_font_size() in class-paypal-payment-buttons.php.
const LENGTH = /^\d+(\.\d+)?(%|px|em|rem|pt|vw|vh)$/;
const SPACING_PRESET = /^var:preset\|spacing\|[a-z0-9-]+$/i;
const HEX = /^#([0-9a-f]{3,4}|[0-9a-f]{6}|[0-9a-f]{8})$/i;
const COLOR_PRESET = /^var:preset\|color\|([a-z0-9-]+)$/i;
const CSS_VAR = /^var\(--wp--[a-z0-9-]+\)$/i;
const COLOR_FUNCTION = /^(rgb|hsl)a?\([\d.,%\s/]+\)$/i;
const FONT_SIZE_VAR = /^var\(--wp--preset--font-size--[a-z0-9-]+\)$/i;
// No `/*` or `*/`: a CSS comment would swallow the declarations after it.
const FLUID_SIZE = /^(?!.*[/*]{2})(clamp|calc)\([a-z0-9.,%\s()+\-*/]+\)$/i;
const UNITLESS = /^\d+(\.\d+)?$/;

// The sides and corners the Border Settings panel can write.
const BOX_SIDES = [
	'top',
	'right',
	'bottom',
	'left',
	'topLeft',
	'topRight',
	'bottomRight',
	'bottomLeft',
];
const BORDER_STYLES = [ 'solid', 'dashed', 'dotted', 'double', 'none' ];

/**
 * A length, or a chosen spacing preset.
 *
 * @param {*} value - A raw attribute value.
 * @return {string} The length, or '' when it is not one.
 */
function length( value ) {
	const raw = `${ value ?? '' }`.trim();

	// 0 is a length a merchant can pick — it is how you cancel the stylesheet.
	if ( '0' === raw ) {
		return raw;
	}

	return LENGTH.test( raw ) || SPACING_PRESET.test( raw ) ? raw : '';
}

/**
 * A color the published page will also emit.
 *
 * @param {*} value - A raw attribute value.
 * @return {string} The color, or '' when it is not one.
 */
function color( value ) {
	const raw = `${ value ?? '' }`.trim();

	return HEX.test( raw ) ||
		COLOR_PRESET.test( raw ) ||
		CSS_VAR.test( raw ) ||
		COLOR_FUNCTION.test( raw )
		? raw
		: '';
}

/**
 * A per-side box value — margin, or a per-corner radius.
 *
 * @param {*} sides - A length string, or an object keyed by side or corner.
 * @return {*} The value with every side validated, or undefined when none survive.
 */
function box( sides ) {
	if ( typeof sides === 'string' ) {
		return length( sides ) || undefined;
	}

	if ( ! sides || typeof sides !== 'object' ) {
		return undefined;
	}

	const kept = Object.entries( sides ).reduce( ( out, [ side, value ] ) => {
		const clean = BOX_SIDES.includes( side ) ? length( value ) : '';
		return clean ? { ...out, [ side ]: clean } : out;
	}, {} );

	return Object.keys( kept ).length ? kept : undefined;
}

/**
 * Block styles — Width Settings and Border Settings.
 *
 * @param {object} attributes - The block attributes.
 * @return {object} A React style object, empty when nothing is configured.
 */
export function getWrapperStyle( attributes = {} ) {
	const { blockWidth, style } = attributes;
	const border = style?.border || {};

	// Width never reaches the style engine, so a spacing preset would be emitted
	// raw. The width control cannot produce one; this keeps it that way.
	const width = length( blockWidth );
	const maxWidth = SPACING_PRESET.test( width ) ? '' : width;

	const strokeWidth = length( border.width );
	const strokeColor = color( border.color );
	// A half-set stroke renders inconsistently, so width, color and style go in
	// together or not at all. border-style defaults to `none`, so a width and a
	// color on their own would draw nothing.
	const stroke =
		strokeWidth && strokeColor
			? {
					width: strokeWidth,
					color: strokeColor,
					style: BORDER_STYLES.includes( border.style ) ? border.style : 'solid',
			  }
			: {};

	return {
		...( maxWidth ? { maxWidth } : {} ),
		...getSpacingClassesAndStyles( {
			style: { spacing: { margin: box( style?.spacing?.margin ) } },
		} ).style,
		...getBorderClassesAndStyles( {
			style: { border: { ...stroke, radius: box( border.radius ) } },
		} ).style,
	};
}

/**
 * QR caption styles — Color and Typography.
 *
 * @param {object} attributes - The block attributes.
 * @return {object} A React style object, empty when nothing is configured.
 */
export function getCaptionStyle( attributes = {} ) {
	const { captionColor, captionFontSize } = attributes;
	const size = `${ captionFontSize ?? '' }`.trim();
	// FontSizePicker hands back the size with its unit — `20px`, a theme preset's
	// `1rem`, or a fluid `clamp(…)` — and drops the unit when the theme's own
	// sizes are numbers. Core reads a bare number as px.
	const fontSize = UNITLESS.test( size )
		? `${ size }px`
		: length( size ) || ( FONT_SIZE_VAR.test( size ) || FLUID_SIZE.test( size ) ? size : '' );

	// The caption never goes through the style engine, so a chosen palette entry
	// is expanded here the way sanitize_css_color() expands it for the page.
	const clean = color( captionColor );
	const preset = clean.match( COLOR_PRESET );

	return {
		...( clean ? { color: preset ? `var(--wp--preset--color--${ preset[ 1 ] })` : clean } : {} ),
		...( fontSize ? { fontSize } : {} ),
	};
}
