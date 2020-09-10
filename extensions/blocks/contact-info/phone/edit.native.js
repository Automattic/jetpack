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

import stylesEditor from '../editor.scss';
import styles from '../style.scss';

const PhoneEdit = props => {
	const { setAttributes, getStylesFromColorScheme } = props;
	const placeholderTextColor = getStylesFromColorScheme(
		styles.placeholder.color,
		styles.placeholderDark.color
	);
	const nativeProps = {
		keyboardType: 'phone-pad',
		style: stylesEditor.blockEditorPlainText,
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
