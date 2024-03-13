import { __ } from '@wordpress/i18n';
import simpleInput from '../../../shared/simple-input';
import save from './save';

const NameEdit = props => {
	const { setAttributes } = props;
	return simpleInput( 'name', props, __( 'Name', 'jetpack' ), save, nextValue =>
		setAttributes( { name: nextValue } )
	);
};

export default NameEdit;
