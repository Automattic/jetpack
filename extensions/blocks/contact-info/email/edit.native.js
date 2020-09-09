/**
 * Internal dependencies
 */
import save from './save';
import simpleInput from '../../../shared/simple-input';
import { __ } from '@wordpress/i18n';

import styles from '../editor.scss';

const EmailEdit = props => {
	const { setAttributes } = props;
	const nativeProps = {
		keyboardType: 'email-address',
		style: styles.blockEditorPlainText,
		placeholderTextColor: styles.placeholder.color,
	};
	return simpleInput( 'email', { ...props, ...nativeProps }, __( 'Email', 'jetpack' ), save, nextValue =>
		setAttributes( { email: nextValue } )
	);
};

export default EmailEdit;
