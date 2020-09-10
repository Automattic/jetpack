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
	const placeholderTextColor = getStylesFromColorScheme(
		styles.placeholder.color,
		styles.placeholderDark.color
	);
	const nativeProps = {
		keyboardType: 'email-address',
		style: stylesEditor.blockEditorPlainText,
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
