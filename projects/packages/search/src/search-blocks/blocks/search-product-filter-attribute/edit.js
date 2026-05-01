/**
 * Editor preview for jetpack/search-product-filter-attribute.
 *
 * One block instance targets one WC product attribute taxonomy (`pa_color`,
 * `pa_size`, …). The picker is seeded from `/wp/v2/taxonomies` via
 * `core-data` and constrained to the `pa_` prefix so site builders only see
 * actual WC product attributes — non-WC sites get an empty list and a
 * Placeholder explaining the block can't render.
 *
 * Once an attribute is chosen, the preview mirrors filter-checkbox: a
 * labeled list with sample buckets so designers can style the list in
 * place.
 */
import { InspectorControls, useBlockProps } from '@wordpress/block-editor';
import {
	PanelBody,
	Placeholder,
	RangeControl,
	SelectControl,
	TextControl,
	ToggleControl,
} from '@wordpress/components';
import { useSelect } from '@wordpress/data';
import { createElement as h, Fragment, useMemo } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

const ATTRIBUTE_PREFIX = 'pa_';

const SAMPLE_FILTER_ITEMS = [
	{ value: 'red', label: __( 'Red', 'jetpack-search-pkg' ), count: 12 },
	{ value: 'blue', label: __( 'Blue', 'jetpack-search-pkg' ), count: 8 },
	{ value: 'green', label: __( 'Green', 'jetpack-search-pkg' ), count: 3 },
];

/**
 * Strip the `pa_` prefix and humanize the remainder so a fallback label
 * reads naturally ("pa_screen_size" → "Screen Size") when the registered
 * taxonomy doesn't carry a singular_name.
 *
 * @param {string} slug - Taxonomy slug.
 * @return {string} Humanized name.
 */
function humanizeAttributeSlug( slug ) {
	const bare = slug.startsWith( ATTRIBUTE_PREFIX ) ? slug.slice( ATTRIBUTE_PREFIX.length ) : slug;
	return bare
		.split( '_' )
		.filter( Boolean )
		.map( word => word.charAt( 0 ).toUpperCase() + word.slice( 1 ) )
		.join( ' ' );
}

/**
 * Edit component for the search-product-filter-attribute block.
 *
 * @param {object}   props               - Block props.
 * @param {object}   props.attributes    - Saved block attributes.
 * @param {Function} props.setAttributes - Attribute setter.
 * @return {object} Rendered element.
 */
export default function SearchProductFilterAttributeEdit( { attributes, setAttributes } ) {
	const blockProps = useBlockProps( { className: 'jetpack-search-product-filter-attribute' } );
	const rawLabel = attributes?.label || '';
	const showCount = attributes?.showCount !== false;
	const maxItems = Math.max( 1, attributes?.maxItems ?? 10 );
	const sortOrder = attributes?.bucketSortOrder === 'alpha' ? 'alpha' : 'count';
	const slug = attributes?.attributeTaxonomy || '';

	// Pull registered taxonomies via core-data. `null` while the request is
	// in flight, an array once resolved. We keep the request unconditional
	// because the picker is the block's primary affordance — paying for the
	// REST call once per editor session is fine.
	const taxonomies = useSelect( select => select( 'core' ).getTaxonomies( { per_page: -1 } ), [] );

	// Filter to `pa_*` and project into SelectControl options. A non-WC site
	// resolves to an empty list, so the Placeholder branch below renders the
	// "no attributes registered" message instead of an empty <select>.
	const attributeOptions = useMemo( () => {
		if ( ! Array.isArray( taxonomies ) ) {
			return null;
		}
		return taxonomies
			.filter( tax => typeof tax?.slug === 'string' && tax.slug.startsWith( ATTRIBUTE_PREFIX ) )
			.map( tax => ( {
				value: tax.slug,
				label: tax?.labels?.singular_name || tax?.name || humanizeAttributeSlug( tax.slug ),
			} ) )
			.sort( ( a, b ) => a.label.localeCompare( b.label ) );
	}, [ taxonomies ] );

	const isLoading = attributeOptions === null;
	const hasAttributes = ! isLoading && attributeOptions.length > 0;
	const selectedOption = hasAttributes ? attributeOptions.find( opt => opt.value === slug ) : null;
	const previewLabel = rawLabel || ( selectedOption ? selectedOption.label : '' );

	const inspector = h(
		InspectorControls,
		null,
		h(
			PanelBody,
			{ title: __( 'Settings', 'jetpack-search-pkg' ) },
			h( SelectControl, {
				__next40pxDefaultSize: true,
				__nextHasNoMarginBottom: true,
				label: __( 'Attribute', 'jetpack-search-pkg' ),
				value: slug,
				onChange: value => setAttributes( { attributeTaxonomy: value } ),
				options: [
					{ value: '', label: __( '— Select an attribute —', 'jetpack-search-pkg' ) },
					...( attributeOptions ?? [] ),
				],
				disabled: ! hasAttributes,
				help: hasAttributes
					? __(
							'Pick which WooCommerce product attribute drives this filter.',
							'jetpack-search-pkg'
					  )
					: __(
							'No WooCommerce product attributes were found on this site.',
							'jetpack-search-pkg'
					  ),
			} ),
			h( TextControl, {
				__next40pxDefaultSize: true,
				__nextHasNoMarginBottom: true,
				label: __( 'Label', 'jetpack-search-pkg' ),
				value: rawLabel,
				placeholder: previewLabel,
				onChange: value => setAttributes( { label: value } ),
				help: __(
					'Heading shown above the options. Leave empty to use the attribute’s name.',
					'jetpack-search-pkg'
				),
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
				label: __( 'Maximum items shown', 'jetpack-search-pkg' ),
				value: maxItems,
				min: 1,
				max: 50,
				onChange: value => setAttributes( { maxItems: Math.max( 1, Number( value ) || 1 ) } ),
			} ),
			h( SelectControl, {
				__next40pxDefaultSize: true,
				__nextHasNoMarginBottom: true,
				label: __( 'Sort order', 'jetpack-search-pkg' ),
				value: sortOrder,
				onChange: value => setAttributes( { bucketSortOrder: value } ),
				options: [
					{ value: 'count', label: __( 'By count (most matches first)', 'jetpack-search-pkg' ) },
					{ value: 'alpha', label: __( 'Alphabetical', 'jetpack-search-pkg' ) },
				],
			} )
		)
	);

	// Pre-pick state: empty <select> placeholder so the author knows the
	// block needs configuration before it'll render anything on the front
	// end. Same affordance as the Custom Taxonomy filter-checkbox variation.
	if ( ! slug ) {
		return h(
			Fragment,
			null,
			inspector,
			h(
				'div',
				blockProps,
				h( Placeholder, {
					label: __( 'Filter by Attribute', 'jetpack-search-pkg' ),
					instructions: hasAttributes
						? __(
								'Pick a WooCommerce product attribute in the block sidebar to enable this filter.',
								'jetpack-search-pkg'
						  )
						: __(
								'No WooCommerce product attributes are registered on this site, so this block has nothing to filter on.',
								'jetpack-search-pkg'
						  ),
				} )
			)
		);
	}

	// Picked state: render a filter-checkbox-shaped preview with sample
	// buckets so layout/styling can be designed in place.
	return h(
		Fragment,
		null,
		inspector,
		h(
			'div',
			blockProps,
			previewLabel ? h( 'h3', { className: 'jetpack-search-filter__title' }, previewLabel ) : null,
			h(
				'ul',
				{ className: 'jetpack-search-filter__list' },
				SAMPLE_FILTER_ITEMS.map( item =>
					h(
						'li',
						{ key: item.value, className: 'jetpack-search-filter__item' },
						h(
							'label',
							null,
							h( 'input', { type: 'checkbox', disabled: true } ),
							h( 'span', { className: 'jetpack-search-filter__label' }, item.label ),
							showCount
								? h( 'span', { className: 'jetpack-search-filter__count' }, String( item.count ) )
								: null
						)
					)
				)
			)
		)
	);
}
