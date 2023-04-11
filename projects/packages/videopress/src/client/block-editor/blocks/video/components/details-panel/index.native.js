/**
 * WordPress dependencies
 */
import { PanelBody, TextControl, BottomSheetTextControl } from '@wordpress/components';
import { __ } from '@wordpress/i18n';

/**
 * React component that renders the details settings panel.
 *
 * @param {object} props - Component properties.
 * @param {object} props.attributes - Block attributes.
 * @param {Function} props.setAttributes - Function to set attributes.
 * @returns {import('react').ReactElement} - Details panel component.
 */
export default function DetailsPanel( { attributes, setAttributes } ) {
	const { title, description } = attributes;

	return (
		<PanelBody title={ __( 'Details', 'jetpack-videopress-pkg' ) }>
			<TextControl
				value={ title || '' }
				onChange={ value => setAttributes( { title: value } ) }
				placeholder={ __( 'Add title', 'jetpack-videopress-pkg' ) }
				label={ __( 'Title', 'jetpack-videopress-pkg' ) }
			/>
			<BottomSheetTextControl
				initialValue={ description }
				onChange={ value => setAttributes( { description: value } ) }
				placeholder={ __( 'Add description', 'jetpack-videopress-pkg' ) }
				label={ __( 'Description', 'jetpack-videopress-pkg' ) }
			/>
		</PanelBody>
	);
}
