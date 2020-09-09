/**
 * External dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import save from './save';
import simpleInput from '../../../shared/simple-input';
import styles from '../editor.scss';

const PhoneEdit = props => {
	const { setAttributes } = props;
	const nativeProps = {
		keyboardType: 'phone-pad',
		style: styles.blockEditorPlainText,
		placeholderTextColor: styles.placeholder.color,
	};
	return simpleInput( 'phone', { ...props, ...nativeProps }, __( 'Phone number', 'jetpack' ), save, nextValue =>
		setAttributes( { phone: nextValue } )
	);
};

export default PhoneEdit;
