import { isNumber } from 'lodash';

export const useJetpackFieldStyles = attributes => {
	const blockStyle = {
		backgroundColor: attributes.blockBackgroundColor,
		'--jetpack--contact-form--border-color': attributes.borderColor,
		'--jetpack--contact-form--input-background': attributes.fieldBackgroundColor,
		'--jetpack--contact-form--font-size': attributes.fieldFontSize,
		'--jetpack--contact-form--line-height': attributes.lineHeight,
		'--jetpack--contact-form--text-color': attributes.inputColor,
	};

	const labelStyle = {
		color: attributes.labelColor,
		fontSize: attributes.labelFontSize,
	};

	const fieldStyle = {
		backgroundColor: attributes.fieldBackgroundColor,
		borderColor: attributes.borderColor,
		color: attributes.inputColor,
		fontSize: attributes.fieldFontSize,
		lineHeight: attributes.lineHeight,
	};

	if ( isNumber( attributes.borderRadius ) ) {
		fieldStyle.borderRadius = attributes.borderRadius;
	}
	if ( isNumber( attributes.borderWidth ) ) {
		fieldStyle.borderWidth = attributes.borderWidth;
	}

	return {
		blockStyle,
		fieldStyle,
		labelStyle,
	};
};
