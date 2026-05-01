/**
 * Editor preview for jetpack/search-product-filter-status.
 *
 * Mirrors the runtime DOM shape — labeled list with three checkbox options
 * and optional count badges — so designers can style the filter list in
 * place. Inspector exposes the user-tunable attributes (label, showCount).
 */
import { InspectorControls, useBlockProps } from '@wordpress/block-editor';
import { PanelBody, TextControl, ToggleControl } from '@wordpress/components';
import { createElement as h, Fragment } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

// Mirror Search_Product_Filter_Status::get_options() — same value/label
// pairs so the editor preview matches the front-end render shape exactly.
// Sample counts are illustrative; the live block renders real ES counts.
const SAMPLE_OPTIONS = [
	{ value: 'instock', label: __( 'In stock', 'jetpack-search-pkg' ), count: 24 },
	{ value: 'outofstock', label: __( 'Out of stock', 'jetpack-search-pkg' ), count: 3 },
	{ value: 'onbackorder', label: __( 'On backorder', 'jetpack-search-pkg' ), count: 1 },
];

const DEFAULT_LABEL = __( 'Stock status', 'jetpack-search-pkg' );

/**
 * Edit component for the search-product-filter-status block.
 *
 * @param {object}   props               - Block props.
 * @param {object}   props.attributes    - Saved block attributes.
 * @param {Function} props.setAttributes - Attribute setter.
 * @return {object} Rendered element.
 */
export default function SearchProductFilterStatusEdit( { attributes, setAttributes } ) {
	const blockProps = useBlockProps( { className: 'jetpack-search-product-filter-status' } );
	const rawLabel = attributes?.label || '';
	const previewLabel = rawLabel || DEFAULT_LABEL;
	const showCount = attributes?.showCount !== false;

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
					placeholder: DEFAULT_LABEL,
					onChange: value => setAttributes( { label: value } ),
					help: __(
						'Heading shown above the options. Leave empty for the default.',
						'jetpack-search-pkg'
					),
				} ),
				h( ToggleControl, {
					__nextHasNoMarginBottom: true,
					label: __( 'Show result counts', 'jetpack-search-pkg' ),
					checked: showCount,
					onChange: value => setAttributes( { showCount: !! value } ),
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
				SAMPLE_OPTIONS.map( option =>
					h(
						'li',
						{ key: option.value, className: 'jetpack-search-filter__item' },
						h(
							'label',
							null,
							h( 'input', { type: 'checkbox', disabled: true } ),
							h( 'span', { className: 'jetpack-search-filter__label' }, option.label ),
							showCount
								? h( 'span', { className: 'jetpack-search-filter__count' }, String( option.count ) )
								: null
						)
					)
				)
			)
		)
	);
}
