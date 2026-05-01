/**
 * Editor preview for jetpack/search-product-filter-taxonomy.
 *
 * One block instance targets one of the three built-in WC product
 * taxonomies — `product_cat`, `product_tag`, `product_brand`. Variations
 * registered server-side seed each block insert with the right slug, so
 * the inspector picker is mostly an "I changed my mind" affordance rather
 * than the primary control.
 */
import { InspectorControls, useBlockProps } from '@wordpress/block-editor';
import {
	PanelBody,
	RangeControl,
	SelectControl,
	TextControl,
	ToggleControl,
} from '@wordpress/components';
import { createElement as h, Fragment } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

const SAMPLE_FILTER_ITEMS = [
	{ value: 'first', label: __( 'First option', 'jetpack-search-pkg' ), count: 12 },
	{ value: 'second', label: __( 'Second option', 'jetpack-search-pkg' ), count: 5 },
	{ value: 'third', label: __( 'Third option', 'jetpack-search-pkg' ), count: 7 },
];

// Default labels per taxonomy slug. Mirrors
// Search_Product_Filter_Taxonomy::default_label() so the editor preview
// matches what the front-end render emits when the block author leaves
// the label attribute empty.
const TAXONOMY_DEFAULT_LABELS = {
	product_cat: __( 'Category', 'jetpack-search-pkg' ),
	product_tag: __( 'Tag', 'jetpack-search-pkg' ),
	product_brand: __( 'Brand', 'jetpack-search-pkg' ),
};

const TAXONOMY_OPTIONS = [
	{ value: 'product_cat', label: __( 'Category', 'jetpack-search-pkg' ) },
	{ value: 'product_tag', label: __( 'Tag', 'jetpack-search-pkg' ) },
	{ value: 'product_brand', label: __( 'Brand', 'jetpack-search-pkg' ) },
];

/**
 * Edit component for the search-product-filter-taxonomy block.
 *
 * @param {object}   props               - Block props.
 * @param {object}   props.attributes    - Saved block attributes.
 * @param {Function} props.setAttributes - Attribute setter.
 * @return {object} Rendered element.
 */
export default function SearchProductFilterTaxonomyEdit( { attributes, setAttributes } ) {
	const blockProps = useBlockProps( { className: 'jetpack-search-product-filter-taxonomy' } );
	const taxonomy = attributes?.taxonomy || 'product_cat';
	const rawLabel = attributes?.label || '';
	const showCount = attributes?.showCount !== false;
	const maxItems = Math.max( 1, attributes?.maxItems ?? 10 );
	const sortOrder = attributes?.bucketSortOrder === 'alpha' ? 'alpha' : 'count';
	const previewLabel = rawLabel || TAXONOMY_DEFAULT_LABELS[ taxonomy ] || '';

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
					label: __( 'Taxonomy', 'jetpack-search-pkg' ),
					value: taxonomy,
					options: TAXONOMY_OPTIONS,
					onChange: value => setAttributes( { taxonomy: value } ),
				} ),
				h( TextControl, {
					__next40pxDefaultSize: true,
					__nextHasNoMarginBottom: true,
					label: __( 'Label', 'jetpack-search-pkg' ),
					value: rawLabel,
					placeholder: previewLabel,
					onChange: value => setAttributes( { label: value } ),
					help: __(
						'Heading shown above the options. Leave empty to use the taxonomy’s name.',
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
		),
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
