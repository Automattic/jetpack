/**
 * Width, margin, border and text styles for the editor canvas.
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

// Mirrors sanitize_css_length(), sanitize_css_color() and
// sanitize_css_font_size() in class-paypal-payment-buttons.php.
const LENGTH = /^\d+(\.\d+)?(%|px|em|rem|pt|vw|vh)$/;
const SPACING_PRESET = /^var:preset\|spacing\|[a-z0-9-]+$/i;
const HEX = /^#([0-9a-f]{3,4}|[0-9a-f]{6}|[0-9a-f]{8})$/i;
const COLOR_PRESET = /^var:preset\|color\|([a-z0-9-]+)$/i;
const CSS_VAR = /^var\(--wp--[a-z0-9-]+\)$/i;
const COLOR_FUNCTION = /^(rgb|hsl)a?\([\d.,%\s/]+\)$/i;
const FONT_SIZE_VAR = /^var\(--wp--preset--font-size--[a-z0-9-]+\)$/i;
const FLUID_SIZE = /^(clamp|calc)\([a-z0-9.,%\s()+\-*/]+\)$/i;
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
 * A length the style engine will not silently drop.
 *
 * `box()` accepts spacing presets because margin goes through the style engine,
 * which expands them. Border does not: core's JS engine expands a preset radius
 * and wp_style_engine_get_styles() drops it, so a preset would render on the
 * canvas and vanish on the page. Refusing it on both sides keeps them equal.
 *
 * @param {*} sides - A length string, or an object keyed by side or corner.
 * @return {*} The value with presets removed, or undefined when nothing is left.
 */
function plainBox( sides ) {
	const kept = box( sides );

	if ( typeof kept === 'string' ) {
		return SPACING_PRESET.test( kept ) ? undefined : kept;
	}

	if ( ! kept ) {
		return undefined;
	}

	const plain = Object.fromEntries(
		Object.entries( kept ).filter( ( [ , value ] ) => ! SPACING_PRESET.test( value ) )
	);

	return Object.keys( plain ).length ? plain : undefined;
}

/**
 * The chosen width, with its unit.
 *
 * @param {object} attributes - The block attributes.
 * @return {string} The width, or '' when none is set.
 */
function chosenWidth( attributes ) {
	// Width never reaches the style engine, so a spacing preset would be emitted
	// raw. The width control cannot produce one; this keeps it that way.
	const width = length( attributes.blockWidth );

	return SPACING_PRESET.test( width ) ? '' : width;
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
 * @param {object} attributes - The block attributes.
 * @return {object} A React style object, empty when nothing is configured.
 */
function getMarginStyle( attributes ) {
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

	const strokeWidth = plainBox( border.width );
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
 * The QR card — Width, Border and margin all land on the one element the
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
 * The button's product card — margin only.
 *
 * Width and Border belong to the button — see getButtonStyle(). Margin still
 * lands here, since a QR-to-BUTTON format switch can leave one behind.
 * Mirrors get_card_style().
 *
 * @param {object} attributes - The block attributes.
 * @return {object} A React style object, empty when nothing is configured.
 */
export function getCardStyle( attributes = {} ) {
	return getMarginStyle( attributes );
}

/**
 * A validated color, with a chosen palette entry expanded.
 *
 * None of the Color panels go through the style engine, so the expansion
 * sanitize_css_color() does for the page happens here for the canvas. The slug
 * is kebab-cased first, because that is the shape WP defines the custom
 * property in — a `Vivid-Red` slug resolves to nothing otherwise.
 *
 * @param {*} value - A raw attribute value.
 * @return {string} The color, or '' when it is not one.
 */
function cssColor( value ) {
	const clean = color( value );
	const preset = clean.match( COLOR_PRESET );

	return preset ? `var(--wp--preset--color--${ preset[ 1 ].toLowerCase() })` : clean;
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

	// `/*` or `*/` would open a CSS comment and swallow the rest. Kept out of
	// FLUID_SIZE so both languages reject exactly the same set: a `[/*]{2}` class
	// also rejects `**` and `//`, which the PHP side accepts.
	if ( size.includes( '/*' ) || size.includes( '*/' ) ) {
		return '';
	}

	// A spacing preset is a length but not a font size — it would be emitted raw
	// as `font-size:var:preset|spacing|50` and dropped by the browser.
	if ( SPACING_PRESET.test( size ) ) {
		return '';
	}

	return length( size ) || ( FONT_SIZE_VAR.test( size ) || FLUID_SIZE.test( size ) ? size : '' );
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
