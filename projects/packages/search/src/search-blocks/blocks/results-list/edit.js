/**
 * Editor preview for jetpack-search/results-list.
 *
 * The block owns three runtime states (results, empty, error) but the
 * editor canvas always shows the success-state preview — the empty and
 * error copy lives in the Inspector so authors can edit it without a
 * dedicated preview mode.
 *
 * Each layout has its own template function below. Duplication is
 * intentional — the templates are short and rarely change, and keeping
 * them separate means an edit to one layout never silently moves
 * something in another. The conditional/feature-flag approach lived here
 * briefly and was extracted in favor of explicit per-layout markup so
 * reviewers can read each card design end-to-end without resolving flag
 * names.
 */
import { InspectorControls, useBlockProps } from '@wordpress/block-editor';
import { Button, PanelBody, RadioControl, TextControl } from '@wordpress/components';
import { useDispatch, useSelect } from '@wordpress/data';
import { __, _n, sprintf } from '@wordpress/i18n';

// `product` is WC-only. On non-Woo sites it's pruned from the picker and a
// saved `product` value collapses to `expanded` — the renderer applies the
// same fallback in `render.php`, so the editor preview stays in lockstep.
// `window.JetpackSearchBlocksConfig.isWooCommerceBlocksEnabled` is the canonical
// editor-side gate, localized by `Search_Blocks::enqueue_editor_assets()`.
// Read at call time (not module init) so the editor responds to a runtime
// change in the localized config, and so tests can flip the gate per case.
const isWooCommerceBlocksEnabled = () =>
	typeof window !== 'undefined' &&
	window.JetpackSearchBlocksConfig?.isWooCommerceBlocksEnabled === true;
const allowedLayouts = () =>
	isWooCommerceBlocksEnabled() ? [ 'compact', 'expanded', 'product' ] : [ 'compact', 'expanded' ];
const DEFAULT_LAYOUT = 'expanded';

const SAMPLE_RESULTS = [
	{
		title: __( 'First sample result', 'jetpack-search-pkg' ),
		contentSnippet: __(
			'Matches content: this snippet shows the relevant passage that matched your search query.',
			'jetpack-search-pkg'
		),
		path: 'example.com/articles/first',
		author: __( 'Sample Author', 'jetpack-search-pkg' ),
		date: 'Apr 1, 2026',
		hasImage: true,
	},
	{
		title: __( 'Another relevant post', 'jetpack-search-pkg' ),
		contentSnippet: __(
			'Matches content: a second excerpt demonstrating how content highlights appear in results.',
			'jetpack-search-pkg'
		),
		path: 'example.com/guides/another',
		author: __( 'A. Writer, B. Editor', 'jetpack-search-pkg' ),
		date: 'Mar 22, 2026',
		hasImage: true,
	},
	// Third row demonstrates the image-less collapse — image column drops out,
	// text fills the row. Mirrors the runtime behavior when a result's
	// `imageUrl` is empty.
	{
		title: __( 'Older archived entry', 'jetpack-search-pkg' ),
		contentSnippet: __(
			'Matches content: an older post with a brief excerpt showing the matched text.',
			'jetpack-search-pkg'
		),
		path: 'example.com/2025/older',
		date: 'Dec 18, 2025',
	},
];

const SAMPLE_PRODUCTS = [
	{
		title: __( 'Sample product', 'jetpack-search-pkg' ),
		formattedPrice: '$24.00',
		rating: 4.5,
		ratingPercent: '90%',
		reviewCount: 42,
	},
	{
		title: __( 'Another product on sale', 'jetpack-search-pkg' ),
		formattedRegularPrice: '$30.00',
		formattedSalePrice: '$19.99',
		hasSalePrice: true,
		rating: 3.5,
		ratingPercent: '70%',
		reviewCount: 12,
		matchHint: 'content',
	},
	{
		title: __( 'Third product', 'jetpack-search-pkg' ),
		formattedPrice: '$48.00',
		rating: 5,
		ratingPercent: '100%',
		reviewCount: 7,
	},
];

// Declared as a function (rather than a module-level constant) so the `__()`
// calls run after the block editor's i18n is loaded — otherwise the strings
// would be cached in the source locale on module init. Mirrors the same
// pattern in `results-sort/edit.js`.
const LAYOUT_OPTIONS = () => {
	const options = [
		{ label: __( 'Compact', 'jetpack-search-pkg' ), value: 'compact' },
		{ label: __( 'Expanded', 'jetpack-search-pkg' ), value: 'expanded' },
	];
	if ( isWooCommerceBlocksEnabled() ) {
		options.push( {
			label: __( 'Product (for WooCommerce stores)', 'jetpack-search-pkg' ),
			value: 'product',
		} );
	}
	return options;
};

/**
 * Summarize a `{ postTypeMode, postTypes }` pair into a single inspector line.
 * No `postTypes` → "All post types"; otherwise "Include only: slug, slug" or
 * "Exclude: slug, slug". Slugs only (no label resolution) — keeps the hint
 * dependency-free; the picker in the parent's "Search scope" panel renders
 * the friendly labels.
 *
 * @param {object} parentAttributes - Parent search-results block attributes.
 * @return {string} Human-readable scope summary.
 */
function describeParentScope( parentAttributes ) {
	const postTypes = Array.isArray( parentAttributes?.postTypes ) ? parentAttributes.postTypes : [];
	if ( postTypes.length === 0 ) {
		return __( 'All post types', 'jetpack-search-pkg' );
	}
	const joined = postTypes.join( ', ' );
	const mode = parentAttributes?.postTypeMode;
	if ( mode === 'include' ) {
		return sprintf(
			/* translators: %s — comma-separated post-type slugs. */
			__( 'Include only: %s', 'jetpack-search-pkg' ),
			joined
		);
	}
	if ( mode === 'exclude' ) {
		return sprintf(
			/* translators: %s — comma-separated post-type slugs. */
			__( 'Exclude: %s', 'jetpack-search-pkg' ),
			joined
		);
	}
	// Unknown / missing mode with a non-empty list — the schema shouldn't
	// produce this, but a saved-attribute mismatch shouldn't read as the
	// wrong scope. Collapse to the unscoped summary.
	return __( 'All post types', 'jetpack-search-pkg' );
}

/**
 * Editor preview for the results-list block.
 *
 * @param {object}   props               - Block props.
 * @param {object}   props.attributes    - Block attributes.
 * @param {Function} props.setAttributes - Attribute setter.
 * @param {string}   props.clientId      - Block client id; used to look up the
 *                                       parent `search-results` for the scope
 *                                       hint panel.
 * @return {object} Rendered element.
 */
export default function ResultsListEdit( { attributes, setAttributes, clientId } ) {
	// Hint panel mirrors the parent `search-results` block's "Search scope"
	// configuration so authors who click into Results List (the visible block)
	// can see what scope is in effect and jump straight to the parent's panel
	// to change it. Single source of truth — the attribute lives on the parent;
	// this is read-only + a navigation affordance.
	const { parentScopeBlockId, parentScopeAttributes } = useSelect(
		select => {
			const blockEditor = select( 'core/block-editor' );
			const parents = blockEditor.getBlockParentsByBlockName(
				clientId,
				'jetpack-search/search-results',
				true
			);
			const parentId = parents[ 0 ];
			if ( ! parentId ) {
				return { parentScopeBlockId: null, parentScopeAttributes: null };
			}
			return {
				parentScopeBlockId: parentId,
				parentScopeAttributes: blockEditor.getBlockAttributes( parentId ),
			};
		},
		[ clientId ]
	);
	const { selectBlock } = useDispatch( 'core/block-editor' );
	const stored = attributes?.layout ?? DEFAULT_LAYOUT;
	// Pre-rename block markup used `card` for what the picker now calls
	// `expanded`. Promote the legacy value so saved content keeps its first-
	// class layout binding instead of falling through to the unknown-layout
	// fallback. Mirrors `$resolve_layout` in render.php.
	const normalized = stored === 'card' ? 'expanded' : stored;
	const layout = allowedLayouts().includes( normalized ) ? normalized : DEFAULT_LAYOUT;
	const blockProps = useBlockProps( {
		className: `jetpack-search-results--${ layout }`,
	} );
	// Defaults mirror render.php so the inspector placeholder matches what
	// visitors actually see when the field is left empty.
	const noResultsDefault = __( 'No results found. Try a different search.', 'jetpack-search-pkg' );
	const noResultsWithFiltersDefault = __(
		'No results match these filters. Try clearing some, or searching for something else.',
		'jetpack-search-pkg'
	);
	const errorDefault = __( 'Something went wrong. Please try again.', 'jetpack-search-pkg' );
	return (
		<>
			<InspectorControls>
				<PanelBody title={ __( 'Settings', 'jetpack-search-pkg' ) }>
					<RadioControl
						label={ __( 'Result format', 'jetpack-search-pkg' ) }
						selected={ layout }
						options={ LAYOUT_OPTIONS() }
						onChange={ value => setAttributes( { layout: value } ) }
					/>
					<TextControl
						__next40pxDefaultSize
						__nextHasNoMarginBottom
						label={ __( 'No-results message', 'jetpack-search-pkg' ) }
						value={ attributes?.noResultsMessage || '' }
						placeholder={ noResultsDefault }
						onChange={ value => setAttributes( { noResultsMessage: value } ) }
						help={ __(
							'Shown when a search returns nothing. Leave empty for the default.',
							'jetpack-search-pkg'
						) }
					/>
					<TextControl
						__next40pxDefaultSize
						__nextHasNoMarginBottom
						label={ __( 'No-results message (when filters are active)', 'jetpack-search-pkg' ) }
						value={ attributes?.noResultsWithFiltersMessage || '' }
						placeholder={ noResultsWithFiltersDefault }
						onChange={ value => setAttributes( { noResultsWithFiltersMessage: value } ) }
						help={ __(
							'Shown when active filters return zero results. Leave empty for the default.',
							'jetpack-search-pkg'
						) }
					/>
					<TextControl
						__next40pxDefaultSize
						__nextHasNoMarginBottom
						label={ __( 'Error message', 'jetpack-search-pkg' ) }
						value={ attributes?.errorMessage || '' }
						placeholder={ errorDefault }
						onChange={ value => setAttributes( { errorMessage: value } ) }
						help={ __(
							'Shown when a search request fails. Leave empty for the default.',
							'jetpack-search-pkg'
						) }
					/>
				</PanelBody>
				{ parentScopeBlockId && (
					<PanelBody title={ __( 'Search scope', 'jetpack-search-pkg' ) } initialOpen={ false }>
						<p
							style={ {
								marginTop: 0,
								marginBottom: '8px',
								fontSize: '12px',
								color: 'rgba(30, 30, 30, 0.62)',
							} }
						>
							{ __(
								'Configured on the parent Search Results block — the block that frames this search experience owns its post-type scope.',
								'jetpack-search-pkg'
							) }
						</p>
						<p
							style={ {
								marginTop: 0,
								marginBottom: '12px',
								fontSize: '13px',
								fontWeight: 500,
							} }
						>
							{ describeParentScope( parentScopeAttributes ) }
						</p>
						<Button
							__next40pxDefaultSize
							variant="secondary"
							onClick={ () => selectBlock( parentScopeBlockId ) }
						>
							{ __( 'Edit on Search Results', 'jetpack-search-pkg' ) }
						</Button>
					</PanelBody>
				) }
			</InspectorControls>
			<div { ...blockProps }>
				{ layout === 'compact' && renderCompactPreview( SAMPLE_RESULTS ) }
				{ layout === 'expanded' && renderExpandedPreview( SAMPLE_RESULTS ) }
				{ layout === 'product' && renderProductPreview( SAMPLE_PRODUCTS ) }
			</div>
		</>
	);
}

/**
 * Compact preview — title and date on a single dense row, no image or path.
 *
 * @param {Array} results - Sample rows.
 * @return {object} Rendered element.
 */
function renderCompactPreview( results ) {
	return (
		<ul className="jetpack-search-results__list">
			{ results.map( result => (
				<li key={ result.path } className="jetpack-search-results__item">
					<div className="jetpack-search-results__copy">
						<h3 className="jetpack-search-results__title">{ result.title }</h3>
						<div className="jetpack-search-results__meta">
							<span className="jetpack-search-results__date">{ result.date }</span>
						</div>
					</div>
				</li>
			) ) }
		</ul>
	);
}

/**
 * Expanded preview — title, breadcrumb path, author + date meta, and a side
 * image. The default layout for blogs and content sites.
 *
 * @param {Array} results - Sample rows.
 * @return {object} Rendered element.
 */
function renderExpandedPreview( results ) {
	return (
		<ul className="jetpack-search-results__list">
			{ results.map( result => (
				<li key={ result.path } className="jetpack-search-results__item">
					<div className="jetpack-search-results__copy">
						<h3 className="jetpack-search-results__title">{ result.title }</h3>
						{ result.contentSnippet && (
							<div className="jetpack-search-results__content">{ result.contentSnippet }</div>
						) }
						<div className="jetpack-search-results__path">{ result.path }</div>
						<div className="jetpack-search-results__meta">
							{ result.author && (
								<span className="jetpack-search-results__author">{ result.author }</span>
							) }
							{ result.author && result.date && (
								<span className="jetpack-search-results__meta-separator" aria-hidden="true">
									·
								</span>
							) }
							{ result.date && (
								<span className="jetpack-search-results__date">{ result.date }</span>
							) }
						</div>
					</div>
					{ result.hasImage && (
						<a className="jetpack-search-results__image-link" tabIndex={ -1 } aria-hidden="true" />
					) }
				</li>
			) ) }
		</ul>
	);
}

/**
 * Product preview — image-on-top grid card with price (sale-aware) and a
 * star rating bar. For WooCommerce stores.
 *
 * @param {Array} products - Sample product rows.
 * @return {object} Rendered element.
 */
function renderProductPreview( products ) {
	return (
		<ul className="jetpack-search-results__list">
			{ products.map( product => (
				<li key={ product.title } className="jetpack-search-results__item">
					<a
						className="jetpack-search-results__product-image-link"
						tabIndex={ -1 }
						aria-hidden="true"
					>
						<span className="jetpack-search-results__product-image-placeholder" />
					</a>
					<div className="jetpack-search-results__copy">
						<h3 className="jetpack-search-results__title">{ product.title }</h3>
						<div className="jetpack-search-results__price">
							{ product.hasSalePrice ? (
								<>
									<del className="jetpack-search-results__price-regular">
										{ product.formattedRegularPrice }
									</del>{ ' ' }
									<ins className="jetpack-search-results__price-sale">
										{ product.formattedSalePrice }
									</ins>
								</>
							) : (
								<span className="jetpack-search-results__price-current">
									{ product.formattedPrice }
								</span>
							) }
						</div>
						<div
							className="jetpack-search-results__rating"
							role="img"
							aria-label={ sprintf(
								/* translators: %1$s: average product rating; %2$d: number of reviews. */
								_n(
									'%1$s out of 5 stars based on %2$d review',
									'%1$s out of 5 stars based on %2$d reviews',
									product.reviewCount,
									'jetpack-search-pkg'
								),
								product.rating,
								product.reviewCount
							) }
						>
							<span className="jetpack-search-results__rating-stars" aria-hidden="true">
								<span
									className="jetpack-search-results__rating-fill"
									style={ { width: product.ratingPercent } }
								/>
							</span>
							<span className="jetpack-search-results__rating-count" aria-hidden="true">
								({ product.reviewCount })
							</span>
						</div>
						{ product.matchHint && (
							<div className="jetpack-search-results__match-hint">
								<mark>
									{ product.matchHint === 'comments'
										? __( 'Matches comments', 'jetpack-search-pkg' )
										: __( 'Matches content', 'jetpack-search-pkg' ) }
								</mark>
							</div>
						) }
					</div>
				</li>
			) ) }
		</ul>
	);
}
