/**
 * Internal dependencies
 */
import save from './save';
import { __ } from 'presets/jetpack/utils/i18n';
import simpleInput from 'presets/jetpack/utils/simple-input';

const EmailEdit = props => {
	const { setAttributes } = props;
	return simpleInput( 'email', props, __( 'Email' ), save, nextValue =>
		setAttributes( { email: nextValue } )
	);
};

export default EmailEdit;
