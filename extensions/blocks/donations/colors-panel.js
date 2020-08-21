/**
 * WordPress dependencies
 */
import { __experimentalPanelColorGradientSettings as PanelColorGradientSettings } from '@wordpress/block-editor';
import { __ } from '@wordpress/i18n';

const ColorsPanel = ( { styles, setAttributes } ) => {
	const settings = [
		{
			label: __( 'Text Color', 'jetpack' ),
			onColorChange: textColor => setAttributes( { styles: { ...styles, textColor } } ),
			colorValue: styles.textColor,
		},
		{
			label: __( 'Background Color', 'jetpack' ),
			onColorChange: backgroundColor => setAttributes( { styles: { ...styles, backgroundColor } } ),
			colorValue: styles.backgroundColor,
			onGradientChange: gradient => setAttributes( { styles: { ...styles, gradient } } ),
			gradientValue: styles.gradient,
		},
	];
	return (
		<PanelColorGradientSettings
			title={ __( 'Color settings', 'jetpack' ) }
			initialOpen={ false }
			settings={ settings }
		/>
	);
};

export default ColorsPanel;
