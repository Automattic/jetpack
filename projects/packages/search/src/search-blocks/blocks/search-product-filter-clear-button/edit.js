/**
 * Editor preview for jetpack/search-product-filter-clear-button.
 *
 * Always renders the button at full opacity in the editor — the live block
 * hides itself when no filter is active, but a hidden affordance is hard to
 * style or position. The "hide when inactive" toggle in the inspector is
 * preview-only here; the runtime visibility binding is set in render.php.
 */
import { InspectorControls, useBlockProps } from '@wordpress/block-editor';
import { PanelBody, TextControl, ToggleControl } from '@wordpress/components';
import { createElement as h, Fragment } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

const DEFAULT_LABEL = __( 'Clear filters', 'jetpack-search-pkg' );

/**
 * Edit component for the clear-button block.
 *
 * @param {object}   props               - Block props.
 * @param {object}   props.attributes    - Saved block attributes.
 * @param {Function} props.setAttributes - Attribute setter.
 * @return {object} Rendered element.
 */
export default function SearchProductFilterClearButtonEdit( { attributes, setAttributes } ) {
	const blockProps = useBlockProps( { className: 'jetpack-search-product-filter-clear-button' } );
	const rawLabel = attributes?.label || '';
	const previewLabel = rawLabel || DEFAULT_LABEL;
	const hideWhenInactive = attributes?.hideWhenInactive !== false;

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
				h( ToggleControl, {
					__nextHasNoMarginBottom: true,
					label: __( 'Hide when no filter is active', 'jetpack-search-pkg' ),
					checked: hideWhenInactive,
					onChange: value => setAttributes( { hideWhenInactive: !! value } ),
					help: __(
						'Reveal the button only once the shopper selects a filter or price range.',
						'jetpack-search-pkg'
					),
				} )
			)
		),
		h(
			'div',
			blockProps,
			h(
				'button',
				{
					type: 'button',
					className: 'wp-element-button jetpack-search-product-filter-clear-button__button',
					disabled: true,
				},
				previewLabel
			)
		)
	);
}
