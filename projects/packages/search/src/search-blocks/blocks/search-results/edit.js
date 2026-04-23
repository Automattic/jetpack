/**
 * Editor preview for jetpack/search-results.
 *
 * Renders sample rows, including the (hidden) image-link wrapper render.php
 * emits so designers can style the `.jetpack-search-results__image-link` /
 * `__image` CSS hooks.
 */
import { useBlockProps } from '@wordpress/block-editor';
import { createElement as h } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

// Mock result data. Dates are intentionally not wrapped in __() because
// they are fixed display strings, not translatable content — localized
// dates come from `formatDate()` on the live front end.
const SAMPLE_RESULTS = [
	{
		title: __( 'First sample result', 'jetpack-search-pkg' ),
		path: 'example.com/articles/first',
		date: 'Apr 1, 2026',
	},
	{
		title: __( 'Another relevant post', 'jetpack-search-pkg' ),
		path: 'example.com/guides/another',
		date: 'Mar 22, 2026',
	},
	{
		title: __( 'Older archived entry', 'jetpack-search-pkg' ),
		path: 'example.com/2025/older',
		date: 'Dec 18, 2025',
	},
];

/**
 * Edit component for the search-results block.
 *
 * @return {object} Rendered element.
 */
export default function SearchResultsEdit() {
	const blockProps = useBlockProps();
	return h(
		'div',
		blockProps,
		h(
			'ul',
			{ className: 'jetpack-search-results__list' },
			SAMPLE_RESULTS.map( result =>
				h(
					'li',
					{ key: result.path, className: 'jetpack-search-results__item' },
					h(
						'div',
						{ className: 'jetpack-search-results__copy' },
						h( 'h3', { className: 'jetpack-search-results__title' }, result.title ),
						h( 'div', { className: 'jetpack-search-results__path' }, result.path ),
						h( 'div', { className: 'jetpack-search-results__date' }, result.date )
					),
					h(
						'a',
						{
							className: 'jetpack-search-results__image-link',
							hidden: true,
							tabIndex: -1,
							'aria-hidden': 'true',
						},
						h( 'img', { className: 'jetpack-search-results__image', alt: '' } )
					)
				)
			)
		)
	);
}
