/**
 * External dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import save from './save';
import CommonChildEdit from '../common';

const PhoneEdit = props => (
	<CommonChildEdit
		{ ...props }
		type={ 'phone' }
		keyboardType={ 'phone-pad' }
		save={ save }
		label={ __( 'Phone number', 'jetpack' ) }
		attributeKey={ 'phone' }
	/>
);

export default PhoneEdit;
