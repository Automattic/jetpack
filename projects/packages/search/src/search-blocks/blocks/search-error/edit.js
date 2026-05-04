/**
 * Editor preview for jetpack/search-error.
 *
 * The front end hides this block unless the store reports a failed fetch.
 * The editor keeps the successful-results preview clean while still
 * exposing the message setting in the Inspector.
 */
import { InspectorControls, useBlockProps } from '@wordpress/block-editor';
import { PanelBody, TextControl } from '@wordpress/components';
import { createElement as h, Fragment } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Edit component for the search-error block.
 *
 * @param {object}   props               - Block props.
 * @param {object}   props.attributes    - Saved block attributes.
 * @param {Function} props.setAttributes - Attribute setter.
 * @return {object} Rendered element.
 */
export default function SearchErrorEdit( { attributes, setAttributes } ) {
	const blockProps = useBlockProps();
	const defaultMessage = __( 'Something went wrong. Please try again.', 'jetpack-search-pkg' );
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
					label: __( 'Message', 'jetpack-search-pkg' ),
					value: attributes.message || '',
					placeholder: defaultMessage,
					onChange: value => setAttributes( { message: value } ),
					help: __( 'Leave empty to use the default translated message.', 'jetpack-search-pkg' ),
				} )
			)
		),
		h( 'div', { ...blockProps, hidden: true, 'aria-hidden': 'true' } )
	);
}
