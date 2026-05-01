/**
 * Editor preview for jetpack/search-product-filters.
 *
 * Pure layout container with an InnerBlocks slot. The default template seeds
 * a useful starter set (status + rating + price); authors can add, reorder,
 * or delete children freely. The allowedBlocks list restricts insertion to
 * the product-filter family so unrelated blocks (paragraph, image, …) don't
 * end up in the filter sidebar by accident.
 *
 * Children are *also* registered without an `ancestor` constraint in their
 * own block.json, so an author can drop e.g. `jetpack/search-product-filter-
 * status` directly on a page without this wrapper. This block is for
 * grouping/spacing/layout, not for gating insertion.
 */
import { InnerBlocks, useBlockProps } from '@wordpress/block-editor';
import { createElement as h } from '@wordpress/element';

const TEMPLATE = [
	[ 'jetpack/search-product-filter-status' ],
	[ 'jetpack/search-product-filter-rating' ],
	[ 'jetpack/search-product-filter-price' ],
];

const ALLOWED = [
	'jetpack/search-product-filter-status',
	'jetpack/search-product-filter-rating',
	'jetpack/search-product-filter-price',
	'jetpack/search-product-filter-price-slider',
	'jetpack/search-product-filter-attribute',
	'jetpack/search-product-filter-taxonomy',
	'jetpack/search-product-filter-checkbox-list',
	'jetpack/search-product-filter-chips',
	'jetpack/search-product-filter-clear-button',
	'jetpack/active-filters',
];

/**
 * Edit component for the search-product-filters parent block.
 *
 * @return {object} Rendered element.
 */
export default function SearchProductFiltersEdit() {
	const blockProps = useBlockProps( { className: 'jetpack-search-product-filters' } );
	return h( 'div', blockProps, h( InnerBlocks, { template: TEMPLATE, allowedBlocks: ALLOWED } ) );
}

/**
 * Save component — only renders InnerBlocks.Content. Server-side render emits
 * the wrapper around the children's HTML.
 *
 * @return {object} Rendered element.
 */
export const save = () => h( InnerBlocks.Content, {} );
