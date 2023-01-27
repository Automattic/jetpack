import { TextControl } from '@wordpress/components';
import { __ } from '@wordpress/i18n';

/**
 *
 * @param root0
 * @param root0.setAttributes
 * @param root0.id
 */
export default function JetpackFieldCss( { setAttributes, id } ) {
	return (
		<TextControl
			label={ __( 'Unique CSS ID', 'jetpack' ) }
			value={ id }
			onChange={ value => setAttributes( { id: value } ) }
			help={ __( 'A unique ID that can be used in CSS or as an anchor.', 'jetpack' ) }
		/>
	);
}
