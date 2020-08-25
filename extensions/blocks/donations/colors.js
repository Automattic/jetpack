/**
 * WordPress dependencies
 */
import {
	__experimentalPanelColorGradientSettings as PanelColorGradientSettings,
	__experimentalUseGradient as useGradient,
} from '@wordpress/block-editor';
import { __ } from '@wordpress/i18n';

export const isGradientAvailable = !! useGradient;

/* eslint-disable react-hooks/rules-of-hooks */
export const getGradients = ( {
	gradientAttribute = 'gradient',
	customGradientAttribute = 'customGradient',
} = {} ) => {
	if ( ! isGradientAvailable || ! gradientAttribute || ! customGradientAttribute ) {
		return {};
	}

	return useGradient( { gradientAttribute, customGradientAttribute } );
};
/* eslint-enable react-hooks/rules-of-hooks */

export const ColorsPanel = ( {
	backgroundColor,
	textColor,
	tabBackgroundColor,
	tabTextColor,
	amountsBackgroundColor,
	amountsTextColor,
	buttonBackgroundColor,
	buttonTextColor,
	setBackgroundColor,
	setTextColor,
	setTabBackgroundColor,
	setTabTextColor,
	setAmountsBackgroundColor,
	setAmountsTextColor,
	setButtonBackgroundColor,
	setButtonTextColor,
} ) => {
	const { gradientValue: gradientValue, setGradient: setGradient } = getGradients();
	const { gradientValue: tabGradientValue, setGradient: setTabGradient } = getGradients( {
		gradientAttribute: 'tabGradient',
		customGradientAttribute: 'tabCustomGradient',
	} );
	const { gradientValue: buttonGradientValue, setGradient: setButtonGradient } = getGradients( {
		gradientAttribute: 'buttonGradient',
		customGradientAttribute: 'buttonCustomGradient',
	} );

	return (
		<PanelColorGradientSettings
			title={ __( 'Color settings', 'jetpack' ) }
			initialOpen={ false }
			settings={ [
				{
					label: __( 'Text Color', 'jetpack' ),
					colorValue: textColor.color,
					onColorChange: setTextColor,
				},
				{
					label: __( 'Background Color', 'jetpack' ),
					colorValue: backgroundColor.color,
					onColorChange: setBackgroundColor,
					gradientValue: gradientValue,
					onGradientChange: setGradient,
				},
				{
					label: __( 'Tab Text Color', 'jetpack' ),
					colorValue: tabTextColor.color,
					onColorChange: setTabTextColor,
				},
				{
					label: __( 'Tab Background Color', 'jetpack' ),
					colorValue: tabBackgroundColor.color,
					onColorChange: setTabBackgroundColor,
					gradientValue: tabGradientValue,
					onGradientChange: setTabGradient,
				},
				{
					label: __( 'Amounts Text Color', 'jetpack' ),
					colorValue: amountsTextColor.color,
					onColorChange: setAmountsTextColor,
				},
				{
					label: __( 'Amounts Background Color', 'jetpack' ),
					colorValue: amountsBackgroundColor.color,
					onColorChange: setAmountsBackgroundColor,
				},
				{
					label: __( 'Button Text Color', 'jetpack' ),
					colorValue: buttonTextColor.color,
					onColorChange: setButtonTextColor,
				},
				{
					label: __( 'Button Background Color', 'jetpack' ),
					colorValue: buttonBackgroundColor.color,
					onColorChange: setButtonBackgroundColor,
					gradientValue: buttonGradientValue,
					onGradientChange: setButtonGradient,
				},
			] }
		/>
	);
};
