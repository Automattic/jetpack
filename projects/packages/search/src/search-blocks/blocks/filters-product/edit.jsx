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
 *
 * The default appender's hover-triggered click zone isn't visually bounded,
 * so a click just outside this InnerBlocks region silently inserts the new
 * filter as a sibling in the parent instead of a child here — it never joins
 * the composition, with no indication anything went wrong (SEARCH-317).
 * `ButtonBlockAppender` bounds the insertion target inside the container, the
 * editor-only outline+label makes the boundary visible before a click, and
 * the Notice below catches any stray filter block that still ends up outside
 * — see AGENTS.md's "Editor preview gotchas" for the general pattern.
 */
import { InnerBlocks, useBlockProps } from '@wordpress/block-editor';
import { Notice } from '@wordpress/components';
import { useSelect } from '@wordpress/data';
import { __ } from '@wordpress/i18n';

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
 * @param {object} props          - Block props.
 * @param {string} props.clientId - This block's client id.
 * @return {object} Rendered element.
 */
export default function FiltersProductEdit( { clientId } ) {
	const hasStraySibling = useSelect(
		select => {
			const { getBlockRootClientId, getBlocks } = select( 'core/block-editor' );
			const parentClientId = getBlockRootClientId( clientId );
			return getBlocks( parentClientId ).some(
				block => block.clientId !== clientId && ALLOWED.includes( block.name )
			);
		},
		[ clientId ]
	);

	const blockProps = useBlockProps( {
		className: 'jetpack-search-filters-product jetpack-search-filters-product__editor-canvas',
	} );
	return (
		<div { ...blockProps }>
			<span className="jetpack-search-filters-product__editor-label">
				{ __( 'Filters Product', 'jetpack-search-pkg' ) }
			</span>
			{ hasStraySibling && (
				<Notice status="warning" isDismissible={ false }>
					{ __(
						"A filter block sits outside this container and won't be part of these filters. Move it inside, or delete it if unintended.",
						'jetpack-search-pkg'
					) }
				</Notice>
			) }
			<InnerBlocks
				template={ TEMPLATE }
				allowedBlocks={ ALLOWED }
				renderAppender={ InnerBlocks.ButtonBlockAppender }
			/>
		</div>
	);
}

export const save = () => <InnerBlocks.Content />;
