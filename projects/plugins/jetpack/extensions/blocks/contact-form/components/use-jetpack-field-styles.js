export const useJetpackFieldStyles = attributes => {
	const blockStyle = {
		backgroundColor: attributes.blockBackgroundColor,
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
