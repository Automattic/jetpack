import { __ } from '@wordpress/i18n';
import CommonChildEdit from '../common';
import save from './save';

const NameEdit = props => (
	<CommonChildEdit
		{ ...props }
		type={ 'name' }
		save={ save }
		label={ __( 'Name', 'jetpack' ) }
		attributeKey={ 'name' }
	/>
);

export default NameEdit;
