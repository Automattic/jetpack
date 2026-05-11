/**
 * Editor preview for jetpack-search/filters-product.
 *
 * Pure layout container with an InnerBlocks slot. The default template seeds
 * a useful starter set scoped to products (post-type scope locked to
 * `product` + a bulk clear-all + stock-status + rating + price); authors can
 * add, reorder, or delete children freely. The allowedBlocks list restricts
 * insertion to the filter family in deliberate order — scope-setter, then the
 * active-filters pill region (with its companion clear-all), then the curated
 * WC filters, then generic extension points — so unrelated blocks (paragraph,
 * image, …) don't end up in the sidebar by accident.
 *
 * Children are *also* registered without an `ancestor` constraint in their
 * own block.json, so an author can drop e.g. `jetpack-search/filter-wc-stock-
 * status` directly on a page without this wrapper. This block is for
 * grouping/spacing/layout, not for gating insertion.
 */
import { InnerBlocks, useBlockProps } from '@wordpress/block-editor';

const TEMPLATE = [
	[ 'jetpack-search/filter-post-type', { mode: 'include', postTypes: [ 'product' ] } ],
	[ 'jetpack-search/clear-filters' ],
	[ 'jetpack-search/filter-wc-stock-status' ],
	[ 'jetpack-search/filter-wc-rating' ],
	[ 'jetpack-search/filter-wc-price' ],
];

const ALLOWED = [
	// Author-configured scope — establishes which post types the sidebar
	// constrains; renders nothing on the front end.
	'jetpack-search/filter-post-type',

	// Visitor-facing summary of active selections + bulk-clear affordance.
	'jetpack-search/active-filters',
	'jetpack-search/clear-filters',

	// WC-specific filters (the curated set this composition exists for).
	'jetpack-search/filter-wc-stock-status',
	'jetpack-search/filter-wc-rating',
	'jetpack-search/filter-wc-price',
	'jetpack-search/filter-wc-attribute',

	// Generic extension points for any custom dimensions a store wants to add.
	'jetpack-search/filter-checkbox',
	'jetpack-search/filter-date',
];

/**
 * Edit component for the filters-product block.
 *
 * @return {object} Rendered element.
 */
export default function FiltersProductEdit() {
	const blockProps = useBlockProps( { className: 'jetpack-search-filters-product' } );
	return (
		<div { ...blockProps }>
			<InnerBlocks template={ TEMPLATE } allowedBlocks={ ALLOWED } />
		</div>
	);
}

export const save = () => <InnerBlocks.Content />;
