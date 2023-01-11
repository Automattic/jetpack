import { isNumber } from 'lodash';

export const useJetpackFieldStyles = attributes => {
	const blockStyle = {
		backgroundColor: attributes.blockBackgroundColor,
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
	};

	const fieldStyle = {
		backgroundColor: attributes.fieldBackgroundColor,
		borderColor: attributes.borderColor,
		borderRadius: attributes.borderRadius,
		borderWidth: attributes.borderWidth,
		color: attributes.inputColor,
		fontSize: attributes.fieldFontSize,
		lineHeight: attributes.lineHeight,
	};

	return {
		blockStyle,
		fieldStyle,
		labelStyle,
	};
};
