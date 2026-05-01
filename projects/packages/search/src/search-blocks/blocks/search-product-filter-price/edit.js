/**
 * Editor preview for jetpack/search-product-filter-price.
 *
 * Mirrors the runtime DOM shape — two disabled number inputs joined by
 * an em-dash — so designers can style the price field in place.
 * Inspector exposes the user-tunable attributes (label, currency symbol).
 */
import { InspectorControls, useBlockProps } from '@wordpress/block-editor';
import { PanelBody, TextControl } from '@wordpress/components';
import { createElement as h, Fragment } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

const DEFAULT_LABEL = __( 'Price', 'jetpack-search-pkg' );

/**
 * Edit component for the search-product-filter-price block.
 *
 * @param {object}   props               - Block props.
 * @param {object}   props.attributes    - Saved block attributes.
 * @param {Function} props.setAttributes - Attribute setter.
 * @return {object} Rendered element.
 */
export default function SearchProductFilterPriceEdit( { attributes, setAttributes } ) {
	const blockProps = useBlockProps( { className: 'jetpack-search-product-filter-price' } );
	const rawLabel = attributes?.label || '';
	const previewLabel = rawLabel || DEFAULT_LABEL;
	const symbol = ( attributes?.currencySymbol || '$' ).slice( 0, 2 );

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
				} ),
				h( TextControl, {
					__next40pxDefaultSize: true,
					__nextHasNoMarginBottom: true,
					label: __( 'Currency symbol', 'jetpack-search-pkg' ),
					value: attributes?.currencySymbol || '$',
					maxLength: 2,
					onChange: value => setAttributes( { currencySymbol: value } ),
					help: __(
						'Shown next to each input as a non-interactive adornment.',
						'jetpack-search-pkg'
					),
				} )
			)
		),
		h(
			'div',
			blockProps,
			h( 'h3', { className: 'jetpack-search-filter__title' }, previewLabel ),
			h(
				'div',
				{ className: 'jetpack-search-product-filter-price__inputs' },
				h(
					'div',
					{ className: 'jetpack-search-product-filter-price__field' },
					h(
						'span',
						{ className: 'jetpack-search-product-filter-price__symbol', 'aria-hidden': 'true' },
						symbol
					),
					h( 'input', {
						className:
							'jetpack-search-product-filter-price__input jetpack-search-product-filter-price__input--min',
						type: 'number',
						placeholder: __( 'Min', 'jetpack-search-pkg' ),
						disabled: true,
					} )
				),
				h(
					'span',
					{
						className: 'jetpack-search-product-filter-price__separator',
						'aria-hidden': 'true',
					},
					'–'
				),
				h(
					'div',
					{ className: 'jetpack-search-product-filter-price__field' },
					h(
						'span',
						{ className: 'jetpack-search-product-filter-price__symbol', 'aria-hidden': 'true' },
						symbol
					),
					h( 'input', {
						className:
							'jetpack-search-product-filter-price__input jetpack-search-product-filter-price__input--max',
						type: 'number',
						placeholder: __( 'Max', 'jetpack-search-pkg' ),
						disabled: true,
					} )
				)
			)
		)
	);
}
