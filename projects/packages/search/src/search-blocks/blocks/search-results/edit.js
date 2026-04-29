/**
 * Editor preview for jetpack/search-results.
 */
import { useBlockProps } from '@wordpress/block-editor';
import { createElement as h } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

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
 * Editor preview for the search-results block.
 *
 * @param {object} props            - Block props.
 * @param {object} props.attributes - Block attributes.
 * @return {object} Rendered element.
 */
export default function SearchResultsEdit( { attributes } ) {
	const layout = attributes?.layout ?? 'card';
	const isCompact = layout === 'compact';
	const blockProps = useBlockProps( {
		className: isCompact ? 'jetpack-search-results--compact' : 'jetpack-search-results--card',
	} );
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
						! isCompact && h( 'div', { className: 'jetpack-search-results__path' }, result.path ),
						h(
							'div',
							{ className: 'jetpack-search-results__meta' },
							h( 'span', { className: 'jetpack-search-results__date' }, result.date )
						)
					),
					! isCompact &&
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
