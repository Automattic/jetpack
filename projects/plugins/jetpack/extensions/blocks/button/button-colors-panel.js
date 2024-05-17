import {
	ContrastChecker,
	PanelColorSettings,
	__experimentalPanelColorGradientSettings as PanelColorGradientSettings, // eslint-disable-line wpcalypso/no-unsafe-wp-apis
} from '@wordpress/block-editor';
import { __ } from '@wordpress/i18n';

export default function ButtonColorsPanel( {
	isGradientAvailable,
	backgroundColor,
	fallbackBackgroundColor,
	fallbackTextColor,
	gradientValue,
	setBackgroundColor,
	setGradient,
	setTextColor,
	textColor,
} ) {
	const ButtonContrastChecker = (
		<ContrastChecker
			{ ...{
				// Text is considered large if font size is greater or equal to 18pt or 24px,
				// currently that's not the case for button.
				backgroundColor: backgroundColor.color,
				fallbackBackgroundColor,
				fallbackTextColor,
				isLargeText: false,
				textColor: textColor.color,
			} }
		/>
	);

	if ( isGradientAvailable ) {
		return (
			<PanelColorGradientSettings
				settings={ [
					{
						colorValue: textColor.color,
						label: __( 'Text Color', 'jetpack' ),
						onColorChange: setTextColor,
					},
					{
						colorValue: backgroundColor.color,
						gradientValue: gradientValue,
						label: __( 'Background', 'jetpack' ),
						onColorChange: setBackgroundColor,
						onGradientChange: setGradient,
					},
				] }
				title={ __( 'Background & Text Color', 'jetpack' ) }
			>
				{ ButtonContrastChecker }
			</PanelColorGradientSettings>
		);
	}

	return (
		<PanelColorSettings
			colorSettings={ [
				{
					value: textColor.color,
					onChange: setTextColor,
					label: __( 'Text Color', 'jetpack' ),
				},
				{
					value: backgroundColor.color,
					onChange: setBackgroundColor,
					label: __( 'Background', 'jetpack' ),
				},
			] }
			title={ __( 'Background & Text Color', 'jetpack' ) }
		>
			{ ButtonContrastChecker }
		</PanelColorSettings>
	);
}
