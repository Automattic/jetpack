/**
 * External dependencies
 */
import { PlainText } from '@wordpress/block-editor';
import { View } from 'react-native';

const simpleInput = ( type, props, label, view, onChange ) => {
	const { isSelected } = props;
	const value = props.attributes[ type ];
	return (
		<View>
			{/* { ( isSelected || value === '' ) && ( */}
				<PlainText
					value={ value }
					placeholder={ label }
					aria-label={ label }
					onChange={ onChange }
				/>
			{/* ) } */}
		</View>
	);
};

export default simpleInput;
