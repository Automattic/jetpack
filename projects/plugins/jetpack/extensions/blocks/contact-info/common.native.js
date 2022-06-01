import { withPreferredColorScheme } from '@wordpress/compose';
import simpleInput from '../../shared/simple-input';
import styles from './style.scss';

const CommonChildEdit = props => {
	const {
		setAttributes,
		getStylesFromColorScheme,
		type,
		keyboardType,
		save,
		label,
		attributeKey,
	} = props;
	const { color: placeholderTextColor } = getStylesFromColorScheme(
		styles.placeholder,
		styles.placeholderDark
	);
	const textColors = getStylesFromColorScheme(
		styles.blockEditorPlainText,
		styles.blockEditorPlainTextDark
	);
	const nativeProps = {
		keyboardType,
		style: textColors,
		placeholderTextColor,
	};
	return simpleInput( type, { ...props, ...nativeProps }, label, save, nextValue =>
		setAttributes( { [ attributeKey ]: nextValue } )
	);
};

export default withPreferredColorScheme( CommonChildEdit );
