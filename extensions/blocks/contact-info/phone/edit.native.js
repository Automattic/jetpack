/**
 * External dependencies
 */
import { __ } from '@wordpress/i18n';
import { withPreferredColorScheme } from '@wordpress/compose';

/**
 * Internal dependencies
 */
import save from './save';
import simpleInput from '../../../shared/simple-input';

import styles from '../style.scss';

const PhoneEdit = props => {
	const { setAttributes, getStylesFromColorScheme } = props;
	const { color: placeholderTextColor } = getStylesFromColorScheme(
		styles.placeholder,
		styles.placeholderDark
	);
	const textColors = getStylesFromColorScheme(
		styles.blockEditorPlainText,
		styles.blockEditorPlainTextDark
	);
	const nativeProps = {
		keyboardType: 'phone-pad',
		style: textColors,
		placeholderTextColor,
	};
	return simpleInput(
		'phone',
		{ ...props, ...nativeProps },
		__( 'Phone number', 'jetpack' ),
		save,
		nextValue => setAttributes( { phone: nextValue } )
	);
};

export default withPreferredColorScheme( PhoneEdit );
