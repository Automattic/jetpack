/**
 * Editor preview for jetpack-search/filters-product.
 *
 * Pure layout container with an InnerBlocks slot. The default template seeds
 * a useful starter set for a product sidebar (active-filters pill region,
 * category + brand taxonomy chips, rating / price / stock-status); authors
 * can add, reorder, or delete children freely. The allowedBlocks list
 * restricts insertion to the filter family in deliberate order — the
 * active-filters pill region (with its companion clear-all), then the
 * curated WC filters, then generic extension points — so unrelated blocks
 * (paragraph, image, …) don't end up in the sidebar by accident.
 *
 * Children are *also* registered without an `ancestor` constraint in their
 * own block.json, so an author can drop e.g. `jetpack-search/filter-wc-stock-
 * status` directly on a page without this wrapper. This block is for
 * grouping/spacing/layout, not for gating insertion. Product scope is set
 * elsewhere — on the parent `search-results` block's "Search scope"
 * inspector panel (the `product-results` page template pre-configures it).
 */
import { InnerBlocks, useBlockProps } from '@wordpress/block-editor';

const TEMPLATE = [
	[ 'jetpack-search/active-filters' ],
	[
		'jetpack-search/filter-checkbox',
		{ filterType: 'taxonomy', taxonomy: 'product_cat', displayStyle: 'chips' },
	],
	[
		'jetpack-search/filter-checkbox',
		{ filterType: 'taxonomy', taxonomy: 'product_brand', displayStyle: 'chips' },
	],
	[ 'jetpack-search/filter-wc-rating', { enabledStars: [ 4 ] } ],
	[ 'jetpack-search/filter-wc-price', { showSlider: true, autoBounds: true } ],
	[ 'jetpack-search/filter-wc-stock-status' ],
];

const ALLOWED = [
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
