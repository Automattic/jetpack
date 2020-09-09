/**
 * External dependencies
 */
import { PlainText } from '@wordpress/block-editor';
import { View } from 'react-native';

const simpleInput = ( type, props, label, view, onChange ) => {
	const { onFocus } = props;
	const value = props.attributes[ type ];
	const keyboardType = props.keyboardType || 'default';
	return (
		<View>
			<PlainText
			  { ...props }
				value={ value }
				placeholder={ label }
				aria-label={ label }
				onChange={ onChange }
				onFocus={ onFocus }
			/>
		</View>
	);
};

export default simpleInput;
