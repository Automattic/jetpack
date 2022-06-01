import { __ } from '@wordpress/i18n';
import save from './save';
import CommonChildEdit from '../common';

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
