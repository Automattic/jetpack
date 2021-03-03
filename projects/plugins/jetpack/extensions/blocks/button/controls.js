/**
 * Internal dependencies
 */
import ButtonBorderPanel from './button-border-panel';
import ButtonColorsPanel from './button-colors-panel';

export default function ButtonControls( {
	attributes,
	backgroundColor,
	fallbackBackgroundColor,
	fallbackTextColor,
	setAttributes,
	setBackgroundColor,
	setTextColor,
	textColor,
	gradientValue,
	setGradient,
} ) {
	const { borderRadius } = attributes;

	return (
		<>
			<ButtonColorsPanel
				{ ...{
					backgroundColor,
					fallbackBackgroundColor,
					fallbackTextColor,
					gradientValue,
					setBackgroundColor,
					setGradient,
					setTextColor,
					textColor,
				} }
			/>
			<ButtonBorderPanel borderRadius={ borderRadius } setAttributes={ setAttributes } />
		</>
	);
}
