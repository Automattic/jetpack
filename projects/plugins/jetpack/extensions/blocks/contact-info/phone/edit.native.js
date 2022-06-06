import { __ } from '@wordpress/i18n';
import CommonChildEdit from '../common';
import save from './save';

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
