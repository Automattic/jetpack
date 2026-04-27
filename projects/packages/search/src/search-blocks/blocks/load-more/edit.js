/**
 * Editor preview for jetpack/load-more.
 *
 * Includes the (hidden) loading-spinner span render.php emits so the
 * `.jetpack-search-load-more__spinner` CSS hook is available to style. The
 * Inspector exposes a text input for the `buttonLabel` attribute; the saved
 * value (or the translated default) is what render.php prints on the front
 * end.
 */
import { InspectorControls, useBlockProps } from '@wordpress/block-editor';
import { PanelBody, TextControl } from '@wordpress/components';
import { createElement as h, Fragment } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Edit component for the load-more block.
 *
 * @param {object}   props               - Block props.
 * @param {object}   props.attributes    - Saved block attributes.
 * @param {Function} props.setAttributes - Attribute setter.
 * @return {object} Rendered element.
 */
export default function LoadMoreEdit( { attributes, setAttributes } ) {
	const blockProps = useBlockProps();
	const defaultLabel = __( 'Load more results', 'jetpack-search-pkg' );
	// Match render.php: a whitespace-only label falls back to the default
	// in the preview so the editor mirrors the front-end behaviour the
	// "Leave empty…" help text describes. The raw input is still stored.
	const buttonLabel = ( attributes?.buttonLabel || '' ).trim() || defaultLabel;
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
					label: __( 'Button label', 'jetpack-search-pkg' ),
					value: attributes?.buttonLabel || '',
					placeholder: defaultLabel,
					onChange: value => setAttributes( { buttonLabel: value } ),
					help: __( 'Leave empty to use the default translated label.', 'jetpack-search-pkg' ),
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
					className: 'wp-element-button jetpack-search-load-more__button',
					disabled: true,
				},
				buttonLabel
			),
			h(
				'span',
				{ className: 'jetpack-search-load-more__spinner', hidden: true },
				__( 'Loading…', 'jetpack-search-pkg' )
			)
		)
	);
}
