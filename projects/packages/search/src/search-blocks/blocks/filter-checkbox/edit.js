/**
 * Editor preview for jetpack-search/filter-checkbox.
 *
 * Shows a labeled list of sample checkbox options mirroring the runtime DOM
 * shape so designers can style the filter list in place. The inspector
 * exposes the user-tunable attributes (filter type, label, showCount,
 * maxItems, bucketSortOrder, displayStyle). The filter-type control lets
 * authors swap between the Category / Tag / Post Type / Author / Product
 * Category / Product Tag / Product Brand / Custom Taxonomy variations
 * without deleting and re-inserting the block.
 *
 * Custom Taxonomy is the one variation whose target isn't fixed by the
 * inserter choice: its variation seeds `taxonomy=''` so the inspector
 * surfaces a SelectControl populated from registered taxonomies (via
 * core-data) so the user can pick which taxonomy to filter by. Without
 * that picker the block would silently render nothing on the front end.
 */
import { InspectorControls, useBlockProps } from '@wordpress/block-editor';
import {
	PanelBody,
	Placeholder,
	SelectControl,
	RangeControl,
	TextControl,
	ToggleControl,
	// eslint-disable-next-line @wordpress/no-unsafe-wp-apis
	__experimentalToggleGroupControl as ToggleGroupControl,
	// eslint-disable-next-line @wordpress/no-unsafe-wp-apis
	__experimentalToggleGroupControlOption as ToggleGroupControlOption,
} from '@wordpress/components';
import { useSelect } from '@wordpress/data';
import { useMemo } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { normalizeDisplayStyle } from '../display-style.js';

// Re-export the shared helper under the same name this module has always
// exposed so existing imports (notably the edit-side unit tests) keep
// resolving without churn.
export { normalizeDisplayStyle };

/**
 * Coerce a saved `queryType` value to the supported enum. Anything that
 * isn't the literal string `'and'` collapses to `'or'`, so legacy saves
 * (missing attribute, `null`, garbage typed in) keep the OR default
 * rather than dropping out entirely. Mirrors `Filter_Checkbox::normalize_query_type()`
 * on the PHP side — both must agree or the editor preview and the
 * server-rendered ES query would disagree on what "All" means.
 *
 * @param {unknown} value - Raw attribute value off `attributes.queryType`.
 * @return {'or' | 'and'} Normalized variant.
 */
export function normalizeQueryType( value ) {
	return value === 'and' ? 'and' : 'or';
}

const SAMPLE_FILTER_ITEMS = [
	{ value: 'one', label: __( 'First option', 'jetpack-search-pkg' ), count: 24 },
	{ value: 'two', label: __( 'Second option', 'jetpack-search-pkg' ), count: 12 },
	{ value: 'three', label: __( 'Third option', 'jetpack-search-pkg' ), count: 7 },
];

// Built-in taxonomies that have their own filter-checkbox variations
// (Category / Tag plus the three WooCommerce product taxonomies). Excluded
// from the custom-taxonomy picker so site builders reach for the dedicated
// variation rather than re-creating it via the generic Custom Taxonomy entry.
const BUILT_IN_TAXONOMY_SLUGS = [
	'category',
	'post_tag',
	'product_cat',
	'product_tag',
	'product_brand',
];

// Variation identifiers mirror the variation `name`s registered in
// Search_Blocks::inject_filter_checkbox_variations() so the inspector picker
// and the block-inserter picker describe the same set of filter schemas.
export const VARIATION_CATEGORY = 'category';
export const VARIATION_POST_TAG = 'post_tag';
export const VARIATION_POST_TYPE = 'post_type';
export const VARIATION_AUTHOR = 'author';
export const VARIATION_PRODUCT_CAT = 'product_cat';
export const VARIATION_PRODUCT_TAG = 'product_tag';
export const VARIATION_PRODUCT_BRAND = 'product_brand';
export const VARIATION_CUSTOM_TAXONOMY = 'custom_taxonomy';

// `window.JetpackSearchBlocksConfig.isWooCommerceActive` is the canonical
// editor-side gate, localized by `Search_Blocks::enqueue_editor_assets()`.
// Read at call time (not module init) so tests can flip the gate per case
// and the editor responds to a runtime change in the localized config.
const isWooCommerceActive = () =>
	typeof window !== 'undefined' && window.JetpackSearchBlocksConfig?.isWooCommerceActive === true;

/**
 * Identify which built-in variation the current (filterType, taxonomy) pair
 * matches. Any taxonomy-family block whose slug isn't a recognized built-in
 * is treated as a custom taxonomy so the slug input reveals itself.
 *
 * @param {object} attributes - Block attributes.
 * @return {string} Variation identifier.
 */
export function deriveVariation( attributes ) {
	const filterType = attributes?.filterType || '';
	if ( filterType === 'post_type' ) {
		return VARIATION_POST_TYPE;
	}
	if ( filterType === 'author' ) {
		return VARIATION_AUTHOR;
	}
	const taxonomy = attributes?.taxonomy || '';
	if ( taxonomy === 'category' ) {
		return VARIATION_CATEGORY;
	}
	if ( taxonomy === 'post_tag' ) {
		return VARIATION_POST_TAG;
	}
	// Product taxonomies map to their dedicated variations only when WC is
	// active. On non-Woo sites the dedicated variations don't exist in the
	// inspector picker, so a saved `product_cat` block surfaces as Custom
	// Taxonomy with the slug preserved — author can still edit the block,
	// and re-activating WC restores the dedicated variation on the next
	// render. Mirrors the dormant-attribute pattern used by results-list.
	if ( taxonomy === 'product_cat' && isWooCommerceActive() ) {
		return VARIATION_PRODUCT_CAT;
	}
	if ( taxonomy === 'product_tag' && isWooCommerceActive() ) {
		return VARIATION_PRODUCT_TAG;
	}
	if ( taxonomy === 'product_brand' && isWooCommerceActive() ) {
		return VARIATION_PRODUCT_BRAND;
	}
	return VARIATION_CUSTOM_TAXONOMY;
}

/**
 * Build the inspector "Filter type" picker options. Mirrors the variations
 * registered server-side by `Search_Blocks::inject_filter_checkbox_variations()`
 * — Product Category / Tag / Brand are dropped on non-Woo sites in lockstep
 * with the inserter so the picker doesn't offer a variation that has no
 * matching server-side schema.
 *
 * Declared as a function (not a module-level constant) so the `__()` calls
 * run after the editor's i18n is loaded and so each render re-evaluates the
 * WC gate. Mirrors the same pattern in `results-list/edit.js`.
 *
 * @return {Array} SelectControl options.
 */
export function variationOptions() {
	const options = [
		{ value: VARIATION_CATEGORY, label: __( 'Category', 'jetpack-search-pkg' ) },
		{ value: VARIATION_POST_TAG, label: __( 'Tag', 'jetpack-search-pkg' ) },
		{ value: VARIATION_POST_TYPE, label: __( 'Post Type', 'jetpack-search-pkg' ) },
		{ value: VARIATION_AUTHOR, label: __( 'Author', 'jetpack-search-pkg' ) },
	];
	if ( isWooCommerceActive() ) {
		options.push(
			{ value: VARIATION_PRODUCT_CAT, label: __( 'Product Category', 'jetpack-search-pkg' ) },
			{ value: VARIATION_PRODUCT_TAG, label: __( 'Product Tag', 'jetpack-search-pkg' ) },
			{ value: VARIATION_PRODUCT_BRAND, label: __( 'Product Brand', 'jetpack-search-pkg' ) }
		);
	}
	options.push( {
		value: VARIATION_CUSTOM_TAXONOMY,
		label: __( 'Custom taxonomy', 'jetpack-search-pkg' ),
	} );
	return options;
}

/**
 * Map a variation identifier back to the (filterType, taxonomy) attribute
 * pair the JS store and PHP helpers expect.
 *
 * Author and Post Type variations carry `previousTaxonomy` forward so a
 * Custom-taxonomy → Author/Post Type → Custom-taxonomy round-trip doesn't
 * force the author to re-enter their slug. render.php ignores `taxonomy`
 * whenever `filterType` isn't 'taxonomy', so the preserved value is purely
 * UI state and never reaches the aggregation request.
 *
 * Category, Tag, and the three product variations overwrite `taxonomy`
 * with their built-in slugs, which means a Custom → Category → Custom
 * round-trip *will* clear the slug. On the return trip we deliberately
 * drop those built-in slugs so the Taxonomy picker doesn't surface them
 * as custom-typed slugs.
 *
 * @param {string} variation        - Target variation identifier.
 * @param {string} previousTaxonomy - Current taxonomy attribute value.
 * @return {{filterType: string, taxonomy: string}} Attribute pair.
 */
export function variationToAttributes( variation, previousTaxonomy ) {
	switch ( variation ) {
		case VARIATION_CATEGORY:
			return { filterType: 'taxonomy', taxonomy: 'category' };
		case VARIATION_POST_TAG:
			return { filterType: 'taxonomy', taxonomy: 'post_tag' };
		case VARIATION_PRODUCT_CAT:
			return { filterType: 'taxonomy', taxonomy: 'product_cat' };
		case VARIATION_PRODUCT_TAG:
			return { filterType: 'taxonomy', taxonomy: 'product_tag' };
		case VARIATION_PRODUCT_BRAND:
			return { filterType: 'taxonomy', taxonomy: 'product_brand' };
		case VARIATION_POST_TYPE:
			// Reset queryType so a Category → Post Type → Category round-trip
			// doesn't carry stale AND semantics from the prior taxonomy. The
			// Logic toggle is hidden on non-taxonomy variations and ES queries
			// double-guard via `filterType === 'taxonomy'`, but without this
			// reset the toggle re-appears showing `All` on return and confuses
			// the author about what the block will actually do.
			return { filterType: 'post_type', taxonomy: previousTaxonomy || '', queryType: 'or' };
		case VARIATION_AUTHOR:
			return { filterType: 'author', taxonomy: previousTaxonomy || '', queryType: 'or' };
		case VARIATION_CUSTOM_TAXONOMY:
		default: {
			const preserved = BUILT_IN_TAXONOMY_SLUGS.includes( previousTaxonomy )
				? ''
				: previousTaxonomy;
			return { filterType: 'taxonomy', taxonomy: preserved };
		}
	}
}

/**
 * Mirror of Filter_Checkbox::default_label(): resolve the variation-specific
 * fallback label for the inspector placeholder. Returns '' for custom
 * taxonomies (caller should then fall back to the generic "Filter").
 *
 * Product taxonomies get distinct "Product X" defaults so an author using
 * both "Filter by Category" and "Filter by Product Category" on the same
 * page sees two clearly different headings.
 *
 * Keep in sync with Filter_Checkbox::default_label() in
 * src/search-blocks/blocks/filter-checkbox/class-filter-checkbox.php — both
 * must recognize the same (filterType, taxonomy) pairs or the empty-label
 * preview heading will disagree with the server-rendered front end.
 *
 * @param {object} attributes - Block attributes.
 * @return {string} Variation default label, or '' when not a built-in variation.
 */
export function variationDefaultLabel( attributes ) {
	const filterType = attributes?.filterType || '';
	if ( filterType === 'post_type' ) {
		return __( 'Post Type', 'jetpack-search-pkg' );
	}
	if ( filterType === 'author' ) {
		return __( 'Author', 'jetpack-search-pkg' );
	}
	if ( filterType === 'taxonomy' ) {
		const taxonomy = attributes?.taxonomy || '';
		if ( taxonomy === 'category' ) {
			return __( 'Category', 'jetpack-search-pkg' );
		}
		if ( taxonomy === 'post_tag' ) {
			return __( 'Tag', 'jetpack-search-pkg' );
		}
		if ( taxonomy === 'product_cat' ) {
			return __( 'Product Category', 'jetpack-search-pkg' );
		}
		if ( taxonomy === 'product_tag' ) {
			return __( 'Product Tag', 'jetpack-search-pkg' );
		}
		if ( taxonomy === 'product_brand' ) {
			return __( 'Product Brand', 'jetpack-search-pkg' );
		}
	}
	return '';
}

/**
 * Edit component for the filter-checkbox block.
 *
 * @param {object}   props               - Block props.
 * @param {object}   props.attributes    - Saved block attributes.
 * @param {Function} props.setAttributes - Attribute setter.
 * @return {object} Rendered element.
 */
export default function FilterCheckboxEdit( { attributes, setAttributes } ) {
	const displayStyle = normalizeDisplayStyle( attributes?.displayStyle );
	const blockProps = useBlockProps( { 'data-display-style': displayStyle } );
	const currentVariation = deriveVariation( attributes );
	const isCustomTaxonomy = currentVariation === VARIATION_CUSTOM_TAXONOMY;
	const taxonomy = attributes?.taxonomy || '';
	const needsTaxonomyChoice = isCustomTaxonomy && '' === taxonomy;

	// Pull the registered taxonomies for the picker. `getTaxonomies` is the
	// core-data shortcut for getEntityRecords( 'root', 'taxonomy' ); it
	// returns null while the request is in flight and an array of taxonomy
	// objects once resolved. Skip the request entirely outside the
	// custom-taxonomy variation so the built-in variations don't pay for a
	// REST call they never use. No `per_page` arg — the
	// /wp/v2/taxonomies endpoint doesn't register that collection param,
	// and the response is a finite list anyway.
	const taxonomies = useSelect(
		select => ( isCustomTaxonomy ? select( 'core' ).getTaxonomies() : null ),
		[ isCustomTaxonomy ]
	);
	// Derive options separately so the filter/map only re-runs when the
	// underlying records change, not on every store update that re-runs the
	// useSelect callback.
	const taxonomyOptions = useMemo( () => {
		if ( ! Array.isArray( taxonomies ) ) {
			return null;
		}
		return taxonomies
			.filter(
				t =>
					t?.slug && ! BUILT_IN_TAXONOMY_SLUGS.includes( t.slug ) && t?.visibility?.public !== false
			)
			.map( t => ( { value: t.slug, label: t.name || t.slug } ) );
	}, [ taxonomies ] );
	const isLoadingTaxonomies = isCustomTaxonomy && taxonomies === null;
	const hasNoCustomTaxonomies =
		isCustomTaxonomy && Array.isArray( taxonomyOptions ) && taxonomyOptions.length === 0;

	const rawLabel = attributes?.label || '';
	const variationLabel = variationDefaultLabel( attributes );
	const placeholderLabel = variationLabel || __( 'Filter', 'jetpack-search-pkg' );
	const previewLabel = rawLabel || placeholderLabel;
	const showCount = attributes?.showCount !== false;
	const maxItems = Math.max(
		1,
		Number.isFinite( attributes?.maxItems ) ? attributes.maxItems : 10
	);
	// Unknown values fall back to `count` so the preview controls always
	// reflect a valid enum option; render.php normalizes the same way.
	const bucketSortOrder = attributes?.bucketSortOrder === 'alpha' ? 'alpha' : 'count';
	const queryType = normalizeQueryType( attributes?.queryType );
	// Logic toggle is only meaningful for taxonomy filters — each document
	// has one post_type / author, so an "All" combination with 2+ selections
	// always returns zero results. Hiding the control on those variations
	// keeps authors from setting it by mistake.
	const isTaxonomyFilter = attributes?.filterType === 'taxonomy';

	// Swapping the filter type via the inspector shouldn't wipe an author's
	// custom label, but when the stored label still matches the prior
	// variation's seeded default (i.e., the variation default was never
	// edited), clear it so the new variation's default shows through the
	// placeholder instead of stale copy from the old variation.
	const onVariationChange = nextVariation => {
		const next = variationToAttributes( nextVariation, taxonomy );
		const priorDefault = variationDefaultLabel( attributes );
		if ( rawLabel && priorDefault && rawLabel === priorDefault ) {
			next.label = '';
		}
		setAttributes( next );
	};

	const labelHelp = isCustomTaxonomy
		? __( 'A label is required so visitors see a heading above this filter.', 'jetpack-search-pkg' )
		: __(
				"Leave empty to use the variation's default label (e.g. Category, Tag).",
				'jetpack-search-pkg',
				/* dummy arg to avoid bad minification */ 0
		  );

	return (
		<>
			<InspectorControls>
				<PanelBody title={ __( 'Settings', 'jetpack-search-pkg' ) }>
					<SelectControl
						__next40pxDefaultSize
						__nextHasNoMarginBottom
						label={ __( 'Filter type', 'jetpack-search-pkg' ) }
						value={ currentVariation }
						options={ variationOptions() }
						onChange={ onVariationChange }
						help={ __(
							'What this filter groups results by. Switch without deleting the block.',
							'jetpack-search-pkg'
						) }
					/>
					{ isCustomTaxonomy && (
						<SelectControl
							__next40pxDefaultSize
							__nextHasNoMarginBottom
							label={ __( 'Taxonomy', 'jetpack-search-pkg' ) }
							value={ taxonomy }
							disabled={ hasNoCustomTaxonomies }
							options={ [
								{
									value: '',
									label: isLoadingTaxonomies
										? __( 'Loading taxonomies…', 'jetpack-search-pkg' )
										: __(
												'Select a taxonomy',
												'jetpack-search-pkg',
												/* dummy arg to avoid bad minification */ 0
										  ),
									disabled: true,
								},
								...( taxonomyOptions || [] ),
							] }
							onChange={ value => setAttributes( { taxonomy: value } ) }
							help={
								hasNoCustomTaxonomies
									? __(
											'No custom taxonomies registered on this site. Register one with register_taxonomy() and it will appear here.',
											'jetpack-search-pkg'
									  )
									: __(
											'Pick which registered taxonomy this filter targets. Built-in Category, Tag, and the WooCommerce product taxonomies have their own dedicated filters in the inserter.',
											'jetpack-search-pkg',
											/* dummy arg to avoid bad minification */ 0
									  )
							}
						/>
					) }
					<TextControl
						__next40pxDefaultSize
						__nextHasNoMarginBottom
						label={ __( 'Label', 'jetpack-search-pkg' ) }
						value={ rawLabel }
						placeholder={ placeholderLabel }
						onChange={ value => setAttributes( { label: value } ) }
						help={ labelHelp }
					/>
					<ToggleControl
						__nextHasNoMarginBottom
						label={ __( 'Show result counts', 'jetpack-search-pkg' ) }
						checked={ showCount }
						onChange={ value => setAttributes( { showCount: !! value } ) }
					/>
					<ToggleGroupControl
						__next40pxDefaultSize
						__nextHasNoMarginBottom
						isBlock
						label={ __( 'Display style', 'jetpack-search-pkg' ) }
						value={ displayStyle }
						onChange={ value => setAttributes( { displayStyle: normalizeDisplayStyle( value ) } ) }
					>
						<ToggleGroupControlOption
							value="checkbox-list"
							label={ __( 'Checkbox list', 'jetpack-search-pkg' ) }
						/>
						<ToggleGroupControlOption value="chips" label={ __( 'Chips', 'jetpack-search-pkg' ) } />
					</ToggleGroupControl>
					<RangeControl
						__next40pxDefaultSize
						__nextHasNoMarginBottom
						label={ __( 'Maximum items', 'jetpack-search-pkg' ) }
						value={ maxItems }
						min={ 1 }
						max={ 50 }
						onChange={ value => setAttributes( { maxItems: Math.max( 1, value || 1 ) } ) }
					/>
					<SelectControl
						__next40pxDefaultSize
						__nextHasNoMarginBottom
						label={ __( 'Sort order', 'jetpack-search-pkg' ) }
						value={ bucketSortOrder }
						options={ [
							{ value: 'count', label: __( 'Most results first', 'jetpack-search-pkg' ) },
							{ value: 'alpha', label: __( 'Alphabetical', 'jetpack-search-pkg' ) },
						] }
						onChange={ value =>
							setAttributes( { bucketSortOrder: value === 'alpha' ? 'alpha' : 'count' } )
						}
					/>
					{ isTaxonomyFilter && (
						<ToggleGroupControl
							__next40pxDefaultSize
							__nextHasNoMarginBottom
							isBlock
							label={ __( 'Logic', 'jetpack-search-pkg' ) }
							value={ queryType }
							onChange={ value => setAttributes( { queryType: normalizeQueryType( value ) } ) }
							help={
								queryType === 'and'
									? __( 'Show posts that match all selected options.', 'jetpack-search-pkg' )
									: __(
											'Show posts that match any of the selected options.',
											'jetpack-search-pkg',
											/* dummy arg to avoid bad minification */ 0
									  )
							}
						>
							<ToggleGroupControlOption value="or" label={ __( 'Any', 'jetpack-search-pkg' ) } />
							<ToggleGroupControlOption value="and" label={ __( 'All', 'jetpack-search-pkg' ) } />
						</ToggleGroupControl>
					) }
				</PanelBody>
			</InspectorControls>
			<div { ...blockProps }>
				{ needsTaxonomyChoice ? (
					<Placeholder
						icon="filter"
						label={ __( 'Custom Taxonomy Filter', 'jetpack-search-pkg' ) }
						instructions={ __(
							'Choose a taxonomy in the block settings to enable this filter. Until a taxonomy is set, this block renders nothing on the front end.',
							'jetpack-search-pkg'
						) }
					/>
				) : (
					<>
						<h3 className="jetpack-search-filter__title">{ previewLabel }</h3>
						<ul className="jetpack-search-filter__list">
							{ SAMPLE_FILTER_ITEMS.slice( 0, maxItems ).map( item => (
								<li key={ item.value } className="jetpack-search-filter__item">
									{ /* eslint-disable-next-line jsx-a11y/label-has-associated-control -- the input is a direct child, implicit HTML5 association applies; rule's nesting heuristic doesn't trace through sibling spans */ }
									<label>
										<input type="checkbox" disabled />
										<span className="jetpack-search-filter__label">{ item.label }</span>
										{ showCount && (
											<span className="jetpack-search-filter__count">{ String( item.count ) }</span>
										) }
									</label>
								</li>
							) ) }
						</ul>
					</>
				) }
			</div>
		</>
	);
}
