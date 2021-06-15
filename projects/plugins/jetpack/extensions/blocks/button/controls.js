/**
 * Internal dependencies
 */
import ButtonBorderPanel from './button-border-panel';
import ButtonColorsPanel from './button-colors-panel';
import ButtonWidthPanel from './button-width-panel';

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
	isGradientAvailable,
} ) {
	const { align, borderRadius, width } = attributes;

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
					isGradientAvailable,
				} }
			/>
			<ButtonBorderPanel borderRadius={ borderRadius } setAttributes={ setAttributes } />
			<ButtonWidthPanel
				align={ align }
				width={ width }
				onChange={ newWidth => setAttributes( { width: newWidth } ) }
			/>
		</>
	);
}
