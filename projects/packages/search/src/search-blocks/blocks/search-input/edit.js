/**
 * Editor preview for jetpack/search-input.
 *
 * Mirrors render.php's full structure — screen-reader label, icon, input,
 * and the (initially hidden) clear button — so designers can target every
 * CSS hook.
 */
import { useBlockProps } from '@wordpress/block-editor';
import { createElement as h, useId } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Render the magnifying-glass glyph used by the search input, matching the
 * inline SVG emitted by render.php so the editor preview looks identical.
 *
 * @return {object} Rendered SVG element.
 */
function SearchGlyph() {
	return h(
		'svg',
		{
			className: 'jetpack-search-input__icon',
			'aria-hidden': 'true',
			focusable: 'false',
			xmlns: 'http://www.w3.org/2000/svg',
			width: 24,
			height: 24,
			viewBox: '0 0 24 24',
		},
		h( 'path', {
			d: 'M13 5c-3.3 0-6 2.7-6 6 0 1.4.5 2.7 1.3 3.7l-3.8 3.8 1.1 1.1 3.8-3.8c1 .8 2.3 1.3 3.7 1.3 3.3 0 6-2.7 6-6s-2.7-6-6-6zm0 10.5c-2.5 0-4.5-2-4.5-4.5s2-4.5 4.5-4.5 4.5 2 4.5 4.5-2 4.5-4.5 4.5z',
		} )
	);
}

/**
 * Edit component for the search-input block.
 *
 * @return {object} Rendered element.
 */
export default function SearchInputEdit() {
	const blockProps = useBlockProps();
	// Per-instance id keeps the label→input association valid when the editor
	// renders more than one Search Input on the same canvas.
	const inputId = useId();
	return h(
		'div',
		blockProps,
		h(
			'label',
			{
				className: 'jetpack-search-input__label screen-reader-text',
				htmlFor: inputId,
			},
			__( 'Search', 'jetpack-search-pkg' )
		),
		h(
			'div',
			{ className: 'jetpack-search-input__inside-wrapper' },
			h( SearchGlyph, null ),
			h( 'input', {
				id: inputId,
				type: 'search',
				className: 'jetpack-search-input__field',
				placeholder: __( 'Search…', 'jetpack-search-pkg' ),
				disabled: true,
				readOnly: true,
			} ),
			h(
				'button',
				{
					type: 'button',
					className: 'jetpack-search-input__clear',
					hidden: true,
					disabled: true,
					'aria-label': __( 'Clear search', 'jetpack-search-pkg' ),
				},
				'×'
			)
		)
	);
}
