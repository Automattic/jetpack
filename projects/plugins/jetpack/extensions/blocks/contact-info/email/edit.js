/**
 * Internal dependencies
 */
import save from './save';
import simpleInput from '../../../shared/simple-input';
import { __ } from '@wordpress/i18n';

const EmailEdit = props => {
	const { setAttributes } = props;
	return simpleInput( 'email', props, __( 'Email', 'jetpack' ), save, nextValue =>
		setAttributes( { email: nextValue } )
	);
};

export default EmailEdit;
