/**
 * Editor preview for jetpack-search/wc-product-filters.
 *
 * Pure layout container with an InnerBlocks slot. The default template seeds
 * a useful starter set (stock-status + rating + price); authors can add,
 * reorder, or delete children freely. The allowedBlocks list restricts
 * insertion to the WC product filter family so unrelated blocks (paragraph,
 * image, …) don't end up in the filter sidebar by accident.
 *
 * Children are *also* registered without an `ancestor` constraint in their
 * own block.json, so an author can drop e.g. `jetpack-search/filter-wc-stock-
 * status` directly on a page without this wrapper. This block is for
 * grouping/spacing/layout, not for gating insertion.
 */
import { InnerBlocks, useBlockProps } from '@wordpress/block-editor';

const TEMPLATE = [
	[ 'jetpack-search/filter-wc-stock-status' ],
	[ 'jetpack-search/filter-wc-rating' ],
	[ 'jetpack-search/filter-wc-price' ],
];

const ALLOWED = [
	'jetpack-search/filter-wc-stock-status',
	'jetpack-search/filter-wc-rating',
	'jetpack-search/filter-wc-price',
	'jetpack-search/filter-wc-attribute',
	'jetpack-search/filter-wc-taxonomy',
	'jetpack-search/clear-filters',
	'jetpack-search/active-filters',
];

/**
 * Edit component for the wc-product-filters parent block.
 *
 * @return {object} Rendered element.
 */
export default function WcProductFiltersEdit() {
	const blockProps = useBlockProps( { className: 'jetpack-search-wc-product-filters' } );
	return (
		<div { ...blockProps }>
			<InnerBlocks template={ TEMPLATE } allowedBlocks={ ALLOWED } />
		</div>
	);
}

export const save = () => <InnerBlocks.Content />;
