import cleanEmptyObject from './clean-empty-object';

const deprecateFieldStyles = attributes => {
	const {
		borderColor,
		borderRadius,
		borderWidth,
		fieldBackgroundColor,
		fieldFontSize,
		inputColor,
		labelColor,
		labelFontSize,
		labelLineHeight,
		lineHeight,
		placeholder,
		...restAttributes
	} = attributes;

	const labelStyles = cleanEmptyObject( {
		color: { text: labelColor },
		typography: {
			fontSize: labelFontSize,
			lineHeight: labelLineHeight,
		},
	} );

	const inputStyles = cleanEmptyObject( {
		border: {
			color: borderColor,
			radius: borderRadius ? `${ borderRadius }px` : undefined,
			style: 'solid',
			width: borderWidth,
		},
		color: {
			text: inputColor,
			background: fieldBackgroundColor,
		},
		typography: {
			fontSize: fieldFontSize,
			lineHeight: lineHeight,
		},
	} );

	// Note: Legacy field blocks reused the input styles for options rather than
	//       label styles despite the underlying `label` element for options.
	const optionStyles = cleanEmptyObject( {
		color: {
			text: inputColor,
		},
		typography: {
			fontSize: fieldFontSize,
			lineHeight: lineHeight,
		},
	} );

	return { inputStyles, labelStyles, optionStyles, restAttributes };
};

export default deprecateFieldStyles;
