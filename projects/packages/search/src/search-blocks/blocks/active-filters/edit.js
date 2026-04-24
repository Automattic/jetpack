/**
 * Editor preview for jetpack/active-filters.
 *
 * The live block is hidden until the user selects at least one filter value;
 * render a sample pill so designers can style the block in place.
 */
import { useBlockProps } from '@wordpress/block-editor';
import { createElement as h } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Edit component for the active-filters block.
 *
 * @return {object} Rendered element.
 */
export default function ActiveFiltersEdit() {
	const blockProps = useBlockProps();
	return h(
		'div',
		blockProps,
		h(
			'span',
			{ className: 'jetpack-search-active-filters__heading' },
			__( 'Active filters:', 'jetpack-search-pkg' )
		),
		h(
			'ul',
			{ className: 'jetpack-search-active-filters__pills' },
			h(
				'li',
				null,
				h(
					'button',
					{
						type: 'button',
						className: 'wp-element-button jetpack-search-active-filters__pill',
						disabled: true,
					},
					h(
						'span',
						{ className: 'jetpack-search-active-filters__pill-label' },
						__( 'Example filter', 'jetpack-search-pkg' )
					),
					h(
						'span',
						{ className: 'jetpack-search-active-filters__pill-remove', 'aria-hidden': 'true' },
						'×'
					)
				)
			)
		),
		h(
			'button',
			{
				type: 'button',
				className: 'jetpack-search-active-filters__clear-all',
				disabled: true,
			},
			__( 'Clear all', 'jetpack-search-pkg' )
		)
	);
}
