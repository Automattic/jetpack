/**
 * Editor preview for jetpack/filter-checkbox.
 *
 * Shows a labeled list of sample checkbox options mirroring the runtime DOM
 * shape so designers can style the filter list in place. The inspector
 * exposes the user-tunable attributes (label, showCount, maxItems,
 * bucketSortOrder); the variation-defining attributes — `filterType` and
 * `taxonomy` — are set by the Category / Tag / Post Type / Author / Custom
 * Taxonomy variations registered in class-search-blocks.php and are not
 * surfaced here to keep block instances routable to a known filter schema.
 */
import { InspectorControls, useBlockProps } from '@wordpress/block-editor';
import {
	PanelBody,
	SelectControl,
	RangeControl,
	TextControl,
	ToggleControl,
} from '@wordpress/components';
import { createElement as h, Fragment } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

const SAMPLE_FILTER_ITEMS = [
	{ value: 'one', label: __( 'First option', 'jetpack-search-pkg' ), count: 24 },
	{ value: 'two', label: __( 'Second option', 'jetpack-search-pkg' ), count: 12 },
	{ value: 'three', label: __( 'Third option', 'jetpack-search-pkg' ), count: 7 },
];

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
function variationDefaultLabel( attributes ) {
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
	return h(
		Fragment,
		null,
		h(
			InspectorControls,
			null,
			h(
				PanelBody,
				{ title: __( 'Settings', 'jetpack-search-pkg' ) },
				h( TextControl, {
					__next40pxDefaultSize: true,
					__nextHasNoMarginBottom: true,
					label: __( 'Label', 'jetpack-search-pkg' ),
					value: rawLabel,
					placeholder: placeholderLabel,
					onChange: value => setAttributes( { label: value } ),
					help: __(
						"Leave empty to use the variation's default label (e.g. Category, Tag).",
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
								? h( 'span', { className: 'jetpack-search-filter__count' }, String( item.count ) )
								: null
						)
					)
				)
			)
		)
	);
}
