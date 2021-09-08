/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { CheckboxControl } from '@wordpress/components';

export default function ShowSharingCheckbox( { checked, onChange } ) {
	return (
		<CheckboxControl
			label={ __( 'Show sharing buttons.', 'jetpack' ) }
			checked={ checked }
			onChange={ value => {
				onChange( { jetpack_sharing_enabled: value } );
			} }
		/>
	);
}
