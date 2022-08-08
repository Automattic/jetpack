import { WidthPanel } from '../../shared/width-panel';
import ButtonBorderPanel from './button-border-panel';
import ButtonColorsPanel from './button-colors-panel';

export default function ButtonControls( {
	attributes,
	backgroundColor,
	context,
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
	const { align, borderRadius } = attributes;
	const isWidthSetOnParentBlock = 'jetpack/parentBlockWidth' in context;
	const width = isWidthSetOnParentBlock ? context[ 'jetpack/parentBlockWidth' ] : attributes.width;

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
			<WidthPanel
				align={ align }
				width={ width }
				onChange={ newWidth => setAttributes( { width: newWidth } ) }
			/>
		</>
	);
}
