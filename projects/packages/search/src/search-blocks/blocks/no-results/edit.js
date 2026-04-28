/**
 * Editor preview for jetpack/no-results.
 *
 * The front end hides this block when results are present; the editor always
 * shows it so designers can style it. The Inspector exposes a text input for
 * the `message` attribute, which is read by render.php on the front end.
 */
import { InspectorControls, useBlockProps } from '@wordpress/block-editor';
import { PanelBody, TextControl } from '@wordpress/components';
import { createElement as h, Fragment } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Edit component for the no-results block.
 *
 * @param {object}   props               - Block props.
 * @param {object}   props.attributes    - Saved block attributes.
 * @param {Function} props.setAttributes - Attribute setter.
 * @return {object} Rendered element.
 */
export default function NoResultsEdit( { attributes, setAttributes } ) {
	const blockProps = useBlockProps();
	const defaultMessage = __( 'No results found. Try a different search.', 'jetpack-search-pkg' );
	const message = attributes.message || defaultMessage;
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
		h( 'div', blockProps, h( 'p', null, message ) )
	);
}
