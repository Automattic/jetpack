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
import { __, sprintf } from '@wordpress/i18n';
import { normalizeDisplayStyle } from '../display-style.js';

// Re-export the shared helper under the same name this module has always
// exposed so existing imports (notably the edit-side unit tests) keep
// resolving without churn.
export { normalizeDisplayStyle };

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
export const VARIATION_FILTER_META = 'filter_meta';

// `window.JetpackSearchBlocksConfig.isWooCommerceActive` is the canonical
// editor-side gate, localized by `Search_Blocks::enqueue_editor_assets()`.
// Read at call time (not module init) so tests can flip the gate per case
// and the editor responds to a runtime change in the localized config.
const isWooCommerceActive = () =>
	typeof window !== 'undefined' && window.JetpackSearchBlocksConfig?.isWooCommerceActive === true;

// `JetpackSearchBlocksConfig.supportedCustomTaxonomies` is the editor-side
// whitelist of taxonomy slugs the "Custom Taxonomy" picker may offer.
// Derived server-side by `Search_Blocks::supported_custom_taxonomies()` —
// the intersection of registered taxonomies with Jetpack Search's index
// allowlist, unioned with keys of the `jetpack_search_custom_taxonomy_map`
// filter. Without this whitelist the picker would happily accept a slug
// that Jetpack Search never indexes, and the filter would silently return
// zero buckets on the front end. See:
// https://jetpack.com/support/search/frequently-asked-questions/#troubleshoot-custom-tax
const supportedCustomTaxonomies = () =>
	( typeof window !== 'undefined' &&
		window.JetpackSearchBlocksConfig?.supportedCustomTaxonomies ) ||
	[];

// `JetpackSearchBlocksConfig.customTaxonomyMap` is the user-slug → reserved
// slot map (`{ genre: 'jetpack-search-tag1', ... }`). The picker reads only
// its keys here to append a "(mapped)" suffix in the label so authors know
// the filter routes through a Jetpack Search slot rather than the taxonomy
// itself — and a missing entry in the map means the slug must instead live
// in Jetpack Search's standard index allowlist.
const customTaxonomyMap = () =>
	( typeof window !== 'undefined' && window.JetpackSearchBlocksConfig?.customTaxonomyMap ) || {};

// Postmeta siblings of the two helpers above — power the "Filter by Meta
// Field" variation's picker. Map keys are the supported set; the picker
// suffixes every offered key with `(mapped)` because, unlike taxonomies,
// there's no native indexed-meta path — every meta key in this list reached
// it via the `jetpack_search_custom_meta_map` filter.
const supportedCustomMetaKeys = () =>
	( typeof window !== 'undefined' && window.JetpackSearchBlocksConfig?.supportedCustomMetaKeys ) ||
	[];

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
	if ( filterType === 'meta' ) {
		return VARIATION_FILTER_META;
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
	options.push( {
		value: VARIATION_FILTER_META,
		label: __( 'Meta field', 'jetpack-search-pkg' ),
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
			return { filterType: 'post_type', taxonomy: previousTaxonomy || '' };
		case VARIATION_AUTHOR:
			return { filterType: 'author', taxonomy: previousTaxonomy || '' };
		case VARIATION_FILTER_META:
			// `taxonomy` is reused as the facet-key carrier for the meta
			// filterType — see `Filter_Checkbox::derive_filter_key()` for
			// the rationale. We deliberately CLEAR the carried value when
			// switching INTO the Meta variation: a taxonomy slug isn't a
			// valid meta key, and surfacing it as a typed default would
			// confuse the author. The map-keys whitelist then drives the
			// picker.
			return { filterType: 'meta', taxonomy: '' };
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
	const isFilterMeta = currentVariation === VARIATION_FILTER_META;
	const taxonomy = attributes?.taxonomy || '';
	const needsTaxonomyChoice = ( isCustomTaxonomy || isFilterMeta ) && '' === taxonomy;

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
	//
	// Each option is intersected with `supportedCustomTaxonomies()` (the
	// server-derived whitelist of taxonomies that Jetpack Search will
	// actually return buckets for) so authors can't pick a slug that
	// silently fails at query time. Taxonomies that route through a
	// reserved Jetpack Search slot via `jetpack_search_custom_taxonomy_map`
	// get a "(mapped)" suffix so the editor surface communicates the
	// indirection — the saved attribute value remains the user-facing slug.
	const taxonomyOptions = useMemo( () => {
		if ( ! Array.isArray( taxonomies ) ) {
			return null;
		}
		const supported = new Set( supportedCustomTaxonomies() );
		const map = customTaxonomyMap();
		return taxonomies
			.filter(
				t => t?.slug && ! BUILT_IN_TAXONOMY_SLUGS.includes( t.slug ) && supported.has( t.slug )
			)
			.map( t => {
				const baseLabel = t.name || t.slug;
				const label = map[ t.slug ]
					? sprintf(
							/* translators: %s: taxonomy display name. The "(mapped)" suffix flags a taxonomy that routes through a reserved jetpack-search-tagN slot rather than being natively indexed. */
							__( '%s (mapped)', 'jetpack-search-pkg' ),
							baseLabel
					  )
					: baseLabel;
				return { value: t.slug, label };
			} );
	}, [ taxonomies ] );
	const isLoadingTaxonomies = isCustomTaxonomy && taxonomies === null;
	const hasNoCustomTaxonomies =
		isCustomTaxonomy && Array.isArray( taxonomyOptions ) && taxonomyOptions.length === 0;

	// Meta-key picker — sourced entirely from `JetpackSearchBlocksConfig`. No
	// REST round-trip because the map is the source of truth (no public
	// post-meta-keys API to intersect with). Every offered key is `(mapped)`
	// because membership IS the mapping; the suffix stays for visual parity
	// with the Custom Taxonomy picker.
	const metaKeyOptions = useMemo( () => {
		if ( ! isFilterMeta ) {
			return null;
		}
		// `supportedCustomMetaKeys` is `array_keys( customMetaMap )` server-side
		// (no public-meta-keys API to intersect with), so every entry here is
		// guaranteed to have a slot mapping — the `(mapped)` suffix always
		// applies. If the two arrays are ever decoupled (e.g. an indexed-meta
		// allowlist arrives later), reintroduce a ternary then.
		return supportedCustomMetaKeys().map( key => ( {
			value: key,
			label: sprintf(
				/* translators: %s: meta key. The "(mapped)" suffix flags a meta key routed through a reserved jetpack-search-metaN slot. */
				__( '%s (mapped)', 'jetpack-search-pkg' ),
				key
			),
		} ) );
	}, [ isFilterMeta ] );
	const hasNoMetaKeys =
		isFilterMeta && Array.isArray( metaKeyOptions ) && metaKeyOptions.length === 0;

	// Pre-bind the help-text strings so the inspector JSX can read them via a
	// simple ternary. The minifier has dropped trailing `__()` args before in
	// nearby strings (the reason older code in this file passes a `0` dummy
	// third arg); assigning to a `const` is the safer pattern @claude flagged.
	const metaKeyEmptyHelp = __(
		'No meta keys are mapped to Jetpack Search slots on this site. Register one via the jetpack_search_custom_meta_map filter and it will appear here.',
		'jetpack-search-pkg'
	);
	const metaKeyPickHelp = __(
		'Pick which mapped meta key this filter targets. The key must already be routed through a reserved jetpack-search-metaN slot via the jetpack_search_custom_meta_map filter.',
		'jetpack-search-pkg'
	);

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
											"Jetpack Search doesn't index any custom taxonomies on this site. Map one to a reserved jetpack-search-tagN slot via the jetpack_search_custom_taxonomy_map filter, or add it to Jetpack Search's allowlist, and it will appear here.",
											'jetpack-search-pkg'
									  )
									: __(
											'Pick which registered taxonomy this filter targets. Only taxonomies that Jetpack Search indexes (natively or via a jetpack-search-tagN slot mapping) appear here; "(mapped)" flags a slot-routed entry.',
											'jetpack-search-pkg',
											/* dummy arg to avoid bad minification */ 0
									  )
							}
						/>
					) }
					{ isFilterMeta && (
						<SelectControl
							__next40pxDefaultSize
							__nextHasNoMarginBottom
							label={ __( 'Meta key', 'jetpack-search-pkg' ) }
							value={ taxonomy }
							disabled={ hasNoMetaKeys }
							options={ [
								{
									value: '',
									label: __( 'Select a meta key', 'jetpack-search-pkg' ),
									disabled: true,
								},
								...( metaKeyOptions || [] ),
							] }
							onChange={ value => setAttributes( { taxonomy: value } ) }
							help={ hasNoMetaKeys ? metaKeyEmptyHelp : metaKeyPickHelp }
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
