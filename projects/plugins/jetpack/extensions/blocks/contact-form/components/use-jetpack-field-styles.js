import { isNumber } from 'lodash';

export const useJetpackFieldStyles = attributes => {
	const blockStyle = {
		backgroundColor: attributes.blockBackgroundColor,
		'--jetpack--contact-form--border-color': attributes.borderColor,
		'--jetpack--contact-form--border-radius': isNumber( attributes.borderRadius )
			? `${ attributes.borderRadius }px`
			: '0px',
		'--jetpack--contact-form--border-size': isNumber( attributes.borderWidth )
			? `${ attributes.borderWidth }px`
			: '0px',
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
		borderRadius: isNumber( attributes.borderRadius ) ? attributes.borderRadius : 0,
		borderWidth: isNumber( attributes.borderWidth ) ? attributes.borderWidth : 0,
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
