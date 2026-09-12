/**
 * Width, margin, border, color and text styles for the editor canvas.
 *
 * Margin and border live in `attributes.style`, the same shape core's block
 * supports use, so core's own helpers turn them into CSS — the JS twin of the
 * wp_style_engine_get_styles() call the published page makes. Using them rather
 * than assembling declarations here is what keeps the canvas and the published
 * page from drifting: preset expansion, longhand names and which sides are
 * emitted all come from one implementation.
 *
 * The values are validated the same way first. The published page refuses
 * anything its sanitizers do not recognize, so a block whose attributes were
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
import { kebabCase } from 'lodash';

// Mirrors sanitize_css_length(), sanitize_css_color() and
// sanitize_css_font_size() in class-paypal-payment-buttons.php.
const LENGTH = /^\d+(\.\d+)?(%|px|em|rem|pt|vw|vh)$/;
const SPACING_PRESET = /^var:preset\|spacing\|[a-z0-9-]+$/i;
const HEX = /^#([0-9a-f]{3,4}|[0-9a-f]{6}|[0-9a-f]{8})$/i;
const COLOR_PRESET = /^var:preset\|color\|([a-z0-9-]+)$/i;
const CSS_VAR = /^var\(--wp--[a-z0-9-]+\)$/i;
const COLOR_FUNCTION = /^(rgb|hsl)a?\([\d.,%\s/]+\)$/i;
const FONT_SIZE_VAR = /^var\(--wp--preset--font-size--[a-z0-9-]+\)$/i;
// No doubled `/` or `*`: `/*` opens a comment that swallows the rest, and `**`
// and `//` are not CSS operators.
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
 * A length with no spacing preset in it.
 *
 * `length()` takes presets because margin goes through the style engine, which
 * expands them. Width and border do not: core's JS engine expands a preset
 * radius and wp_style_engine_get_styles() drops it, so a preset would render on
 * the canvas and disappear on the page. Refusing it on both sides keeps them
 * equal. Mirrors plain_length() in class-paypal-payment-buttons.php.
 *
 * @param {*} value - A raw attribute value.
 * @return {string} The length, or '' when it is not a plain one.
 */
function plainLength( value ) {
	const clean = length( value );

	return SPACING_PRESET.test( clean ) ? '' : clean;
}

/**
 * A per-corner box with no spacing preset in it.
 *
 * @param {*} sides - A length string, or an object keyed by corner.
 * @return {*} The value with every corner validated, or undefined when none survive.
 */
function plainBox( sides ) {
	if ( typeof sides === 'string' ) {
		return plainLength( sides ) || undefined;
	}

	if ( ! sides || typeof sides !== 'object' ) {
		return undefined;
	}

	const kept = Object.entries( sides ).reduce( ( out, [ side, value ] ) => {
		const clean = BOX_SIDES.includes( side ) ? plainLength( value ) : '';
		return clean ? { ...out, [ side ]: clean } : out;
	}, {} );

	return Object.keys( kept ).length ? kept : undefined;
}

/**
 * The chosen width, with its unit.
 *
 * @param {object} attributes - The block attributes.
 * @return {string} The width, or '' when none is set.
 */
function chosenWidth( attributes ) {
	return plainLength( attributes.blockWidth );
}

/**
 * Whether the button draws as an outline rather than a filled face.
 *
 * Mirrors is_outline_button() in class-paypal-payment-buttons.php.
 *
 * @param {object} attributes - The block attributes.
 * @return {boolean} True when the Outline style is selected.
 */
export function isOutlineButton( attributes = {} ) {
	return 'outline' === attributes.buttonStyle;
}

/**
 * Margin, from the Border Settings panel.
 *
 * The button's product card takes this and nothing else — Width and Border go
 * on the button, see getButtonStyle(). A QR-to-BUTTON format switch can still
 * leave a margin behind, so the card keeps reading it.
 *
 * @param {object} attributes - The block attributes.
 * @return {object} A React style object, empty when nothing is configured.
 */
export function getMarginStyle( attributes = {} ) {
	return getSpacingClassesAndStyles( {
		style: { spacing: { margin: box( attributes.style?.spacing?.margin ) } },
	} ).style;
}

/**
 * Border Settings — the radius and the stroke.
 *
 * @param {object} attributes - The block attributes.
 * @return {object} A React style object, empty when nothing is configured.
 */
function getBorderStyle( attributes ) {
	const border = attributes.style?.border || {};

	const strokeWidth = plainLength( border.width );
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

	return getBorderClassesAndStyles( {
		style: { border: { ...stroke, radius: plainBox( border.radius ) } },
	} ).style;
}

/**
 * The QR card — Width, Border and margin all go on the one element the
 * merchant sees. Mirrors get_qr_style().
 *
 * @param {object} attributes - The block attributes.
 * @return {object} A React style object, empty when nothing is configured.
 */
export function getQrStyle( attributes = {} ) {
	const maxWidth = chosenWidth( attributes );

	return {
		...( maxWidth ? { maxWidth } : {} ),
		...getMarginStyle( attributes ),
		...getBorderStyle( attributes ),
	};
}

/**
 * A validated color, with a chosen palette entry expanded.
 *
 * None of the Color panels go through the style engine, so the expansion
 * sanitize_css_color() does for the page happens here for the canvas. The slug
 * is kebab-cased the way WP names the custom property, or a `heavenlyBlue` one
 * points at a variable nothing defines. lodash's kebabCase is what core's own
 * _wp_to_kebab_case() is a port of, so the two sides agree by construction.
 *
 * @param {*} value - A raw attribute value.
 * @return {string} The color, or '' when it is not one.
 */
function cssColor( value ) {
	const clean = color( value );
	const preset = clean.match( COLOR_PRESET );

	return preset ? `var(--wp--preset--color--${ kebabCase( preset[ 1 ] ) })` : clean;
}

/**
 * A validated font size, carrying its unit.
 *
 * @param {*} value - A raw attribute value.
 * @return {string} The size, or '' when it is not one.
 */
function cssFontSize( value ) {
	const size = `${ value ?? '' }`.trim();

	// FontSizePicker hands back the size with its unit — `20px`, a theme preset's
	// `1rem`, or a fluid `clamp(…)` — and drops the unit when the theme's own
	// sizes are numbers. Core reads a bare number as px.
	if ( UNITLESS.test( size ) ) {
		return `${ size }px`;
	}

	// A spacing preset is a length but not a font size — it would be emitted raw
	// as `font-size:var:preset|spacing|50` and dropped by the browser.
	return (
		plainLength( size ) || ( FONT_SIZE_VAR.test( size ) || FLUID_SIZE.test( size ) ? size : '' )
	);
}

/**
 * Color and Typography, for the QR caption, the payment link and the button face.
 *
 * All three take the same validation — a value the published page refuses has to
 * be refused here too, whichever format wrote it.
 *
 * @param {string} textColor - The chosen color.
 * @param {string} textSize  - The chosen font size, with or without its unit.
 * @return {object} A React style object, empty when nothing is configured.
 */
export function getTextStyle( textColor, textSize ) {
	const clean = cssColor( textColor );
	const fontSize = cssFontSize( textSize );

	return {
		...( clean ? { color: clean } : {} ),
		...( fontSize ? { fontSize } : {} ),
	};
}

/**
 * Color, Styles and Typography for the checkout button.
 *
 * Mirrors get_button_style() in class-paypal-payment-buttons.php.
 *
 * @param {object} attributes - The block attributes.
 * @return {object} A React style object, empty when nothing is configured.
 */
export function getButtonStyle( attributes = {} ) {
	const { buttonTextColor, buttonBackgroundColor, buttonFontSize } = attributes;

	// Outline takes its transparent background from style.scss. An inline
	// background-color would beat that rule and fill the button back in, so the
	// chosen background is dropped rather than emitted.
	const background = isOutlineButton( attributes ) ? '' : cssColor( buttonBackgroundColor );

	// Width and Border hang on the button, not the product card — see
	// getCardStyle(). The card still caps at 400px, so cap the button at the
	// space it has or a wide value spills out of it.
	const width = chosenWidth( attributes );

	return {
		...getTextStyle( buttonTextColor, buttonFontSize ),
		...( background ? { backgroundColor: background } : {} ),
		...( width ? { width, maxWidth: '100%' } : {} ),
		...getBorderStyle( attributes ),
	};
}
