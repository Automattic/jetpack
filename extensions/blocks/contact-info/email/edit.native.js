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

const EmailEdit = props => {
	const { setAttributes, getStylesFromColorScheme } = props;
	const { color: placeholderTextColor } = getStylesFromColorScheme(
		styles.placeholder,
		styles.placeholderDark
	);
	const textColors = getStylesFromColorScheme(
		styles.blockEditorPlainTextColor,
		styles.blockEditorPlainTextColorDark
	);
	const nativeProps = {
		keyboardType: 'email-address',
		style: { ...stylesEditor.blockEditorPlainText, ...textColors },
		placeholderTextColor,
	};
	return simpleInput(
		'email',
		{ ...props, ...nativeProps },
		__( 'Email', 'jetpack' ),
		save,
		nextValue => setAttributes( { email: nextValue } )
	);
};

export default withPreferredColorScheme( EmailEdit );
