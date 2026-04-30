import {
	ContrastChecker,
	FontSizePicker,
	InspectorControls,
	PanelColorSettings,
} from '@wordpress/block-editor';
import { BoxControl, PanelBody } from '@wordpress/components';
import { __ } from '@wordpress/i18n';

const StyleControls = ( { attributes, setAttributes } ) => {
	const {
		activeTabBackgroundColor,
		activeTabTextColor,
		inactiveTabBackgroundColor,
		inactiveTabTextColor,
		selectedAmountBackgroundColor,
		selectedAmountTextColor,
		tabFontSize,
		tabPadding,
	} = attributes;

	return (
		<InspectorControls group="styles">
			<PanelColorSettings
				title={ __( 'Tabs', 'jetpack' ) }
				initialOpen={ false }
				colorSettings={ [
					{
						value: activeTabBackgroundColor,
						onChange: value => setAttributes( { activeTabBackgroundColor: value } ),
						label: __( 'Active tab background', 'jetpack' ),
					},
					{
						value: activeTabTextColor,
						onChange: value => setAttributes( { activeTabTextColor: value } ),
						label: __( 'Active tab text', 'jetpack' ),
					},
					{
						value: inactiveTabBackgroundColor,
						onChange: value => setAttributes( { inactiveTabBackgroundColor: value } ),
						label: __( 'Inactive tab background', 'jetpack' ),
					},
					{
						value: inactiveTabTextColor,
						onChange: value => setAttributes( { inactiveTabTextColor: value } ),
						label: __( 'Inactive tab text', 'jetpack' ),
					},
				] }
			>
				<ContrastChecker
					backgroundColor={ activeTabBackgroundColor }
					textColor={ activeTabTextColor }
				/>
				<ContrastChecker
					backgroundColor={ inactiveTabBackgroundColor }
					textColor={ inactiveTabTextColor }
				/>
			</PanelColorSettings>
			<PanelColorSettings
				title={ __( 'Selected amount', 'jetpack' ) }
				initialOpen={ false }
				colorSettings={ [
					{
						value: selectedAmountBackgroundColor,
						onChange: value => setAttributes( { selectedAmountBackgroundColor: value } ),
						label: __( 'Background', 'jetpack' ),
					},
					{
						value: selectedAmountTextColor,
						onChange: value => setAttributes( { selectedAmountTextColor: value } ),
						label: __( 'Text', 'jetpack' ),
					},
				] }
			>
				<ContrastChecker
					backgroundColor={ selectedAmountBackgroundColor }
					textColor={ selectedAmountTextColor }
				/>
			</PanelColorSettings>
			<PanelBody title={ __( 'Tab dimensions', 'jetpack' ) } initialOpen={ false }>
				<FontSizePicker
					value={ tabFontSize }
					onChange={ value => setAttributes( { tabFontSize: value } ) }
					__nextHasNoMarginBottom={ true }
					__next40pxDefaultSize={ true }
				/>
				<BoxControl
					label={ __( 'Tab padding', 'jetpack' ) }
					values={ tabPadding }
					onChange={ value => setAttributes( { tabPadding: value } ) }
					__next40pxDefaultSize={ true }
				/>
			</PanelBody>
		</InspectorControls>
	);
};

export default StyleControls;
