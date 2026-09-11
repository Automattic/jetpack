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
 * @package
 */

import {
	__experimentalGetBorderClassesAndStyles as getBorderClassesAndStyles, // eslint-disable-line @wordpress/no-unsafe-wp-apis
	__experimentalGetSpacingClassesAndStyles as getSpacingClassesAndStyles, // eslint-disable-line @wordpress/no-unsafe-wp-apis
} from '@wordpress/block-editor';

/**
 * Block styles — Width Settings and Border Settings.
 *
 * @param {object} attributes - The block attributes.
 * @return {object} A React style object, empty when nothing is configured.
 */
export function getWrapperStyle( attributes = {} ) {
	const { blockWidth, style } = attributes;
	const border = style?.border || {};

	// Mirrors sanitize_border(): a half-set stroke renders inconsistently, so
	// width, color and style go in together or not at all.
	const hasStroke = !! border.width && !! border.color;
	const borderStyle = hasStroke
		? { ...border, style: border.style || 'solid' }
		: { radius: border.radius };

	return {
		// Width carries its own unit and has no core equivalent.
		...( blockWidth ? { maxWidth: blockWidth } : {} ),
		...getSpacingClassesAndStyles( { style: { spacing: style?.spacing } } ).style,
		...getBorderClassesAndStyles( { style: { border: borderStyle } } ).style,
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

	return {
		...( captionColor ? { color: captionColor } : {} ),
		// FontSizePicker hands back the size with its unit — `20px`, a theme
		// preset's `1rem`, or a fluid `clamp(…)` — so it goes through as given,
		// the way sanitize_css_font_size() passes it on the published page.
		...( captionFontSize ? { fontSize: captionFontSize } : {} ),
	};
}
