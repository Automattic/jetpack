/**
 * WordPress dependencies
 */
import {
	ContrastChecker,
	PanelColorSettings,
	__experimentalPanelColorGradientSettings as PanelColorGradientSettings,
} from '@wordpress/block-editor';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { IS_GRADIENT_AVAILABLE } from './constants';

export default function ButtonColorsPanel( {
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

	if ( IS_GRADIENT_AVAILABLE ) {
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
