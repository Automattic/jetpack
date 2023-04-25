import { isNumber } from 'lodash';

export const useJetpackFieldStyles = attributes => {
	const blockStyle = {
		'--jetpack--contact-form--border-color': attributes.borderColor,
		'--jetpack--contact-form--border-radius': isNumber( attributes.borderRadius )
			? `${ attributes.borderRadius }px`
			: null,
		'--jetpack--contact-form--border-size': isNumber( attributes.borderWidth )
			? `${ attributes.borderWidth }px`
			: null,
		'--jetpack--contact-form--input-background': attributes.fieldBackgroundColor,
		'--jetpack--contact-form--font-size': attributes.fieldFontSize,
		'--jetpack--contact-form--line-height': attributes.lineHeight,
		'--jetpack--contact-form--text-color': attributes.inputColor,
	};

	const labelStyle = {
		color: attributes.labelColor,
		fontSize: attributes.labelFontSize,
		lineHeight: attributes.labelLineHeight,
	};

	const fieldStyle = {
		backgroundColor: attributes.fieldBackgroundColor,
		borderColor: attributes.borderColor,
		borderRadius: isNumber( attributes.borderRadius ) ? attributes.borderRadius : null,
		borderWidth: isNumber( attributes.borderWidth ) ? attributes.borderWidth : null,
		color: attributes.inputColor,
		fontSize: attributes.fieldFontSize,
		lineHeight: attributes.lineHeight,
	};

	const optionStyle = {
		color: fieldStyle.color,
		fontSize: fieldStyle.fontSize,
		lineHeight: fieldStyle.lineHeight,
	};

	return {
		blockStyle,
		fieldStyle,
		labelStyle,
		optionStyle,
	};
};
