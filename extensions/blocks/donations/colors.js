/**
 * WordPress dependencies
 */
import {
	__experimentalPanelColorGradientSettings as PanelColorGradientSettings,
	__experimentalUseGradient as useGradient,
} from '@wordpress/block-editor';
import { __ } from '@wordpress/i18n';

export const isGradientAvailable = !! useGradient;

export const getColorClasses = ( { backgroundColor, gradientClass, gradientValue, textColor } ) => {
	return {
		[ backgroundColor.class ]: backgroundColor.class,
		[ textColor.class ]: textColor.class,
		'has-background-gradient': gradientValue,
		[ gradientClass ]: gradientClass,
	};
};

export const getColorStyles = ( { backgroundColor, gradientValue, textColor } ) => {
	return {
		backgroundColor: backgroundColor.color,
		...( gradientValue && { background: gradientValue } ),
		color: textColor.color,
	};
};

export const ColorsPanel = ( {
	backgroundColor,
	textColor,
	tabBackgroundColor,
	tabTextColor,
	tabActiveBackgroundColor,
	tabActiveTextColor,
	amountsBackgroundColor,
	amountsTextColor,
	setBackgroundColor,
	setTextColor,
	setTabBackgroundColor,
	setTabTextColor,
	setTabActiveBackgroundColor,
	setTabActiveTextColor,
	setAmountsBackgroundColor,
	setAmountsTextColor,
} ) => {
	/* eslint-disable react-hooks/rules-of-hooks */
	const { gradientValue: gradientValue, setGradient: setGradient } = isGradientAvailable
		? useGradient()
		: {};
	const { gradientValue: tabGradientValue, setGradient: setTabGradient } = isGradientAvailable
		? useGradient( {
				gradientAttribute: 'tabGradient',
				customGradientAttribute: 'tabCustomGradient',
		  } )
		: {};
	const {
		gradientValue: tabActiveGradientValue,
		setGradient: setTabActiveGradient,
	} = isGradientAvailable
		? useGradient( {
				gradientAttribute: 'tabActiveGradient',
				customGradientAttribute: 'tabActiveCustomGradient',
		  } )
		: {};
	/* eslint-enable react-hooks/rules-of-hooks */

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
					label: __( 'Tab Active Text Color', 'jetpack' ),
					colorValue: tabActiveTextColor.color,
					onColorChange: setTabActiveTextColor,
				},
				{
					label: __( 'Tab Active Background Color', 'jetpack' ),
					colorValue: tabActiveBackgroundColor.color,
					onColorChange: setTabActiveBackgroundColor,
					gradientValue: tabActiveGradientValue,
					onGradientChange: setTabActiveGradient,
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
			] }
		/>
	);
};
