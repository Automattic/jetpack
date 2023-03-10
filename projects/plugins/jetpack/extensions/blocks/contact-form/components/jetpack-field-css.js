import { TextControl } from '@wordpress/components';
import { __ } from '@wordpress/i18n';

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
