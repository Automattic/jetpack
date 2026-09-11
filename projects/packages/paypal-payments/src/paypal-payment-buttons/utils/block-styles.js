/**
 * Width, margin, border and caption styles, as inline CSS.
 *
 * Margin and border live in `attributes.style`, the same shape core's block
 * supports use, so the published page can hand them straight to
 * wp_style_engine_get_styles(). The canvas has no style engine of its own —
 * `@wordpress/style-engine` is not a dependency here — so it builds the same
 * declarations from the same values.
 *
 * @package
 */

/**
 * Resolve a preset reference to the CSS variable it names.
 *
 * Core stores a chosen preset as `var:preset|spacing|50` rather than a value,
 * and resolves it at render. wp_style_engine_get_styles() does this on the
 * published page; this is the canvas's copy.
 *
 * @param {string} value - A raw style value.
 * @return {string} The value, with any preset reference expanded.
 */
export function resolvePreset( value ) {
	const raw = `${ value ?? '' }`.trim();
	const preset = raw.match( /^var:preset\|([a-z0-9-]+)\|(.+)$/i );

	return preset ? `var(--wp--preset--${ preset[ 1 ] }--${ preset[ 2 ] })` : raw;
}

/**
 * Build a `margin` shorthand from core's per-side object.
 *
 * @param {object} margin - `{ top, right, bottom, left }`, any side optional.
 * @return {string} The shorthand, or '' when no side is set.
 */
function marginShorthand( margin ) {
	const sides = [ 'top', 'right', 'bottom', 'left' ];

	if ( ! margin || ! sides.some( side => margin[ side ] ) ) {
		return '';
	}

	return sides.map( side => resolvePreset( margin[ side ] ) || '0' ).join( ' ' );
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
	const out = {};

	// Width carries its own unit, so it goes through as typed.
	if ( blockWidth ) {
		out.maxWidth = blockWidth;
	}

	const margin = marginShorthand( style?.spacing?.margin );
	if ( margin ) {
		out.margin = margin;
	}

	if ( border.radius ) {
		// BorderRadiusControl gives a single value, or one per corner.
		out.borderRadius =
			typeof border.radius === 'string'
				? border.radius
				: [ 'topLeft', 'topRight', 'bottomRight', 'bottomLeft' ]
						.map( corner => border.radius[ corner ] || '0' )
						.join( ' ' );
	}

	// BorderControl hands back width, style and color together. Without a width
	// there is nothing to draw, and without a color the browser would fall back
	// to currentColor and draw a border the merchant never chose.
	const borderColor = resolvePreset( border.color );
	if ( border.width && borderColor ) {
		out.border = `${ border.width } ${ border.style || 'solid' } ${ borderColor }`;
	}

	return out;
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

	const color = resolvePreset( captionColor );
	if ( color ) {
		style.color = color;
	}
	if ( Number.isFinite( captionFontSize ) ) {
		style.fontSize = `${ captionFontSize }px`;
	}

	return style;
}
