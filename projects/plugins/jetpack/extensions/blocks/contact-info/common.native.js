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
		style: { baseColors: { color: editorColors = {} } = {} } = {},
	} = props;
	const { color: placeholderTextColor } = getStylesFromColorScheme(
		styles.placeholder,
		styles.placeholderDark
	);
	const textColors = {
		...getStylesFromColorScheme( styles.blockEditorPlainText, styles.blockEditorPlainTextDark ),
		...( editorColors?.text && { color: editorColors.text } ),
	};
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
