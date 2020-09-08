/**
 * External dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import save from './save';
import simpleInput from '../../../shared/simple-input';

const PhoneEdit = props => {
	const { setAttributes } = props;
	return simpleInput( 'phone', { ...props, keyboardType: 'phone-pad' }, __( 'Phone number', 'jetpack' ), save, nextValue =>
		setAttributes( { phone: nextValue } )
	);
};

export default PhoneEdit;
