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
		'--jetpack--contact-form--button-outline--text-color': attributes.inputColor,
		'--jetpack--contact-form--button-outline--background-color': attributes.buttonBackgroundColor,
		'--jetpack--contact-form--button-outline--border-radius': isNumber(
			attributes.buttonBorderRadius
		)
			? `${ attributes.buttonBorderRadius }px`
			: null,
		'--jetpack--contact-form--button-outline--border-size': isNumber( attributes.buttonBorderWidth )
			? `${ attributes.buttonBorderWidth }px`
			: null,
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
