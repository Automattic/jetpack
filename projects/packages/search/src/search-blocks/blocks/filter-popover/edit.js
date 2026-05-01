/**
 * Editor preview for jetpack/filter-popover.
 *
 * Renders the trigger + a closed panel in the editor so the full Search
 * pattern preview mirrors the front-end default state.
 */
import { InnerBlocks, useBlockProps } from '@wordpress/block-editor';
import { createElement as h } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

const TEMPLATE = [
	[ 'jetpack/active-filters' ],
	[ 'jetpack/filter-checkbox', { filterType: 'taxonomy', taxonomy: 'category' } ],
	[ 'jetpack/filter-checkbox', { filterType: 'taxonomy', taxonomy: 'post_tag' } ],
	[ 'jetpack/filter-checkbox', { filterType: 'post_type' } ],
];

const ALLOWED = [ 'jetpack/filter-checkbox', 'jetpack/active-filters' ];

/**
 * Edit component for the filter-popover block.
 *
 * @return {object} Rendered element.
 */
export default function FilterPopoverEdit() {
	const blockProps = useBlockProps( { className: 'jetpack-search-filter-popover' } );
	return h(
		'div',
		blockProps,
		h(
			'button',
			{
				type: 'button',
				className: 'jetpack-search-filter-popover__trigger',
				'aria-haspopup': 'dialog',
				'aria-expanded': 'false',
				disabled: true,
			},
			h(
				'svg',
				{
					className: 'jetpack-search-filter-popover__icon',
					width: 18,
					height: 18,
					viewBox: '0 0 24 24',
					'aria-hidden': 'true',
					focusable: 'false',
				},
				h( 'path', { fill: 'currentColor', d: 'M3 6h18v2H3V6Zm3 5h12v2H6v-2Zm3 5h6v2H9v-2Z' } )
			),
			h( 'span', { className: 'screen-reader-text' }, __( 'Filter results', 'jetpack-search-pkg' ) )
		),
		h(
			'div',
			{
				className:
					'jetpack-search-filter-popover__panel jetpack-search-filter-popover__panel--editor',
				role: 'dialog',
				'aria-label': __( 'Filters', 'jetpack-search-pkg' ),
				hidden: true,
			},
			h( InnerBlocks, { template: TEMPLATE, allowedBlocks: ALLOWED } )
		)
	);
}

/**
 * Save component — only renders InnerBlocks.Content.
 *
 * @return {object} Rendered element.
 */
export const save = () => h( InnerBlocks.Content, {} );
