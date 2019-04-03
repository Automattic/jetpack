/**
 * External dependencies
 */
import { __ } from '@wordpress/i18n';
import { ToggleControl } from '@wordpress/components';

const JetpackFieldRequiredToggle = ( { required, onChange } ) => {
	return (
		<ToggleControl
			label={ __( 'Required', 'jetpack' ) }
			checked={ required }
			onChange={ onChange }
		/>
	);
};

export default JetpackFieldRequiredToggle;
