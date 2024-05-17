import { __ } from '@wordpress/i18n';
import simpleInput from '../../../shared/simple-input';
import save from './save';

const PhoneEdit = props => {
	const { setAttributes } = props;
	return simpleInput( 'phone', props, __( 'Phone number', 'jetpack' ), save, nextValue =>
		setAttributes( { phone: nextValue } )
	);
};

export default PhoneEdit;
