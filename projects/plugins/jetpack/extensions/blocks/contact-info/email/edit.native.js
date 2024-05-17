import { __ } from '@wordpress/i18n';
import CommonChildEdit from '../common';
import save from './save';

const EmailEdit = props => (
	<CommonChildEdit
		{ ...props }
		type={ 'email' }
		keyboardType={ 'email-address' }
		save={ save }
		label={ __( 'Email', 'jetpack' ) }
		attributeKey={ 'email' }
	/>
);

export default EmailEdit;
