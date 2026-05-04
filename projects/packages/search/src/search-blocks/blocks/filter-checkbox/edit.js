/**
 * Editor preview for jetpack/filter-checkbox.
 *
 * Shows a labeled list of sample checkbox options mirroring the runtime DOM
 * shape so designers can style the filter list in place. The inspector
 * exposes the user-tunable attributes (filter type, label, showCount,
 * maxItems, bucketSortOrder). The filter-type control lets authors swap
 * between the Category / Tag / Post Type / Author / Custom Taxonomy
 * variations without deleting and re-inserting the block.
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
} from '@wordpress/components';
import { useSelect } from '@wordpress/data';
import { createElement as h, Fragment, useMemo } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

const SAMPLE_FILTER_ITEMS = [
	{ value: 'one', label: __( 'First option', 'jetpack-search-pkg' ), count: 24 },
	{ value: 'two', label: __( 'Second option', 'jetpack-search-pkg' ), count: 12 },
	{ value: 'three', label: __( 'Third option', 'jetpack-search-pkg' ), count: 7 },
];

// Built-in taxonomies that have their own filter-checkbox variations
// (Category / Tag). Excluded from the custom-taxonomy picker so site builders
// reach for the dedicated variation rather than re-creating it via the
// generic Custom Taxonomy entry.
const BUILT_IN_TAXONOMY_SLUGS = [ 'category', 'post_tag' ];

// Variation identifiers mirror the variation `name`s registered in
// Search_Blocks::register_variations() so the inspector picker and the
// block-inserter picker describe the same set of filter schemas.
export const VARIATION_CATEGORY = 'category';
export const VARIATION_POST_TAG = 'post_tag';
export const VARIATION_POST_TYPE = 'post_type';
export const VARIATION_AUTHOR = 'author';
export const VARIATION_CUSTOM_TAXONOMY = 'custom_taxonomy';

/**
 * Identify which built-in variation the current (filterType, taxonomy) pair
 * matches. Any taxonomy-family block that isn't `category` or `post_tag` is
 * treated as a custom taxonomy so the slug input reveals itself.
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
	return VARIATION_CUSTOM_TAXONOMY;
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
 * Category and Tag overwrite `taxonomy` with their built-in slugs, which
 * means a Custom → Category → Custom round-trip *will* clear the slug.
 * On the return trip we deliberately drop 'category' and 'post_tag' so the
 * Taxonomy picker doesn't surface them as custom-typed slugs.
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
		case VARIATION_POST_TYPE:
			return { filterType: 'post_type', taxonomy: previousTaxonomy || '' };
		case VARIATION_AUTHOR:
			return { filterType: 'author', taxonomy: previousTaxonomy || '' };
		case VARIATION_CUSTOM_TAXONOMY:
		default: {
			const preserved =
				previousTaxonomy === 'category' || previousTaxonomy === 'post_tag' ? '' : previousTaxonomy;
			return { filterType: 'taxonomy', taxonomy: preserved };
		}
	}
}

/**
 * Mirror of Filter_Checkbox::default_label(): resolve the variation-specific
 * fallback label for the inspector placeholder. Returns '' for custom
 * taxonomies (caller should then fall back to the generic "Filter").
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
	const blockProps = useBlockProps();
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

	return h(
		Fragment,
		null,
		h(
			InspectorControls,
			null,
			h(
				PanelBody,
				{ title: __( 'Settings', 'jetpack-search-pkg' ) },
				h( SelectControl, {
					__next40pxDefaultSize: true,
					__nextHasNoMarginBottom: true,
					label: __( 'Filter type', 'jetpack-search-pkg' ),
					value: currentVariation,
					options: [
						{ value: VARIATION_CATEGORY, label: __( 'Category', 'jetpack-search-pkg' ) },
						{ value: VARIATION_POST_TAG, label: __( 'Tag', 'jetpack-search-pkg' ) },
						{ value: VARIATION_POST_TYPE, label: __( 'Post Type', 'jetpack-search-pkg' ) },
						{ value: VARIATION_AUTHOR, label: __( 'Author', 'jetpack-search-pkg' ) },
						{
							value: VARIATION_CUSTOM_TAXONOMY,
							label: __( 'Custom taxonomy', 'jetpack-search-pkg' ),
						},
					],
					onChange: onVariationChange,
					help: __(
						'What this filter groups results by. Switch without deleting the block.',
						'jetpack-search-pkg'
					),
				} ),
				isCustomTaxonomy &&
					h( SelectControl, {
						__next40pxDefaultSize: true,
						__nextHasNoMarginBottom: true,
						label: __( 'Taxonomy', 'jetpack-search-pkg' ),
						value: taxonomy,
						disabled: hasNoCustomTaxonomies,
						options: [
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
						],
						onChange: value => setAttributes( { taxonomy: value } ),
						help: hasNoCustomTaxonomies
							? __(
									'No custom taxonomies registered on this site. Register one with register_taxonomy() and it will appear here.',
									'jetpack-search-pkg'
							  )
							: __(
									'Pick which registered taxonomy this filter targets. Built-in Category and Tag have their own dedicated filters in the inserter.',
									'jetpack-search-pkg',
									/* dummy arg to avoid bad minification */ 0
							  ),
					} ),
				h( TextControl, {
					__next40pxDefaultSize: true,
					__nextHasNoMarginBottom: true,
					label: __( 'Label', 'jetpack-search-pkg' ),
					value: rawLabel,
					placeholder: placeholderLabel,
					onChange: value => setAttributes( { label: value } ),
					help: labelHelp,
				} ),
				h( ToggleControl, {
					__nextHasNoMarginBottom: true,
					label: __( 'Show result counts', 'jetpack-search-pkg' ),
					checked: showCount,
					onChange: value => setAttributes( { showCount: !! value } ),
				} ),
				h( RangeControl, {
					__next40pxDefaultSize: true,
					__nextHasNoMarginBottom: true,
					label: __( 'Maximum items', 'jetpack-search-pkg' ),
					value: maxItems,
					min: 1,
					max: 50,
					onChange: value => setAttributes( { maxItems: Math.max( 1, value || 1 ) } ),
				} ),
				h( SelectControl, {
					__next40pxDefaultSize: true,
					__nextHasNoMarginBottom: true,
					label: __( 'Sort order', 'jetpack-search-pkg' ),
					value: bucketSortOrder,
					options: [
						{ value: 'count', label: __( 'Most results first', 'jetpack-search-pkg' ) },
						{ value: 'alpha', label: __( 'Alphabetical', 'jetpack-search-pkg' ) },
					],
					onChange: value =>
						setAttributes( { bucketSortOrder: value === 'alpha' ? 'alpha' : 'count' } ),
				} )
			)
		),
		h(
			'div',
			blockProps,
			needsTaxonomyChoice
				? h( Placeholder, {
						icon: 'filter',
						label: __( 'Custom Taxonomy Filter', 'jetpack-search-pkg' ),
						instructions: __(
							'Choose a taxonomy in the block settings to enable this filter. Until a taxonomy is set, this block renders nothing on the front end.',
							'jetpack-search-pkg'
						),
				  } )
				: h(
						Fragment,
						null,
						h( 'h3', { className: 'jetpack-search-filter__title' }, previewLabel ),
						h(
							'ul',
							{ className: 'jetpack-search-filter__list' },
							SAMPLE_FILTER_ITEMS.slice( 0, maxItems ).map( item =>
								h(
									'li',
									{ key: item.value, className: 'jetpack-search-filter__item' },
									h(
										'label',
										null,
										h( 'input', { type: 'checkbox', disabled: true } ),
										h( 'span', { className: 'jetpack-search-filter__label' }, item.label ),
										showCount
											? h(
													'span',
													{ className: 'jetpack-search-filter__count' },
													String( item.count )
											  )
											: null
									)
								)
							)
						)
				  )
		)
	);
}
