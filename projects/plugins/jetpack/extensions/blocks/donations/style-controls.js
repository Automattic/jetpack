import {
	ContrastChecker,
	FontSizePicker,
	InspectorControls,
	PanelColorSettings,
	__experimentalColorGradientControl as ColorGradientControl, // eslint-disable-line @wordpress/no-unsafe-wp-apis
} from '@wordpress/block-editor';
import {
	BoxControl,
	PanelBody,
	__experimentalToggleGroupControl as ToggleGroupControl, // eslint-disable-line @wordpress/no-unsafe-wp-apis
	__experimentalToggleGroupControlOption as ToggleGroupControlOption, // eslint-disable-line @wordpress/no-unsafe-wp-apis
} from '@wordpress/components';
import { useMemo } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

const StyleControls = ( { attributes, setAttributes } ) => {
	const {
		activeTabBackgroundColor,
		activeTabTextColor,
		inactiveTabBackgroundColor,
		inactiveTabTextColor,
		selectedAmountBackgroundColor,
		selectedAmountTextColor,
		tabsAppearance,
		tabBorderColor,
		tabFontSize,
		tabPadding,
		buttonFontSize,
		buttonPadding,
		buttonAlignment,
	} = attributes;

	// Stable setter refs so JSX props don't get a new function on every render
	// (required by react/jsx-no-bind).
	const set = useMemo( () => {
		const make = name => value => setAttributes( { [ name ]: value } );
		return {
			tabsAppearance: make( 'tabsAppearance' ),
			activeTabBackgroundColor: make( 'activeTabBackgroundColor' ),
			activeTabTextColor: make( 'activeTabTextColor' ),
			inactiveTabBackgroundColor: make( 'inactiveTabBackgroundColor' ),
			inactiveTabTextColor: make( 'inactiveTabTextColor' ),
			tabBorderColor: make( 'tabBorderColor' ),
			tabFontSize: make( 'tabFontSize' ),
			tabPadding: make( 'tabPadding' ),
			selectedAmountBackgroundColor: make( 'selectedAmountBackgroundColor' ),
			selectedAmountTextColor: make( 'selectedAmountTextColor' ),
			buttonFontSize: make( 'buttonFontSize' ),
			buttonPadding: make( 'buttonPadding' ),
			buttonAlignment: value => setAttributes( { buttonAlignment: value || '' } ),
		};
	}, [ setAttributes ] );

	const selectedAmountColorSettings = useMemo(
		() => [
			{
				value: selectedAmountBackgroundColor,
				onChange: set.selectedAmountBackgroundColor,
				label: __( 'Background', 'jetpack' ),
			},
			{
				value: selectedAmountTextColor,
				onChange: set.selectedAmountTextColor,
				label: __( 'Text', 'jetpack' ),
			},
		],
		[ selectedAmountBackgroundColor, selectedAmountTextColor, set ]
	);

	return (
		<InspectorControls group="styles">
			<PanelBody title={ __( 'Tabs', 'jetpack' ) } initialOpen={ false }>
				<ToggleGroupControl
					label={ __( 'Appearance', 'jetpack' ) }
					value={ tabsAppearance || 'tabs' }
					onChange={ set.tabsAppearance }
					isBlock
					__next40pxDefaultSize
					__nextHasNoMarginBottom
				>
					<ToggleGroupControlOption value="tabs" label={ __( 'Tabs', 'jetpack' ) } />
					<ToggleGroupControlOption value="buttons" label={ __( 'Buttons', 'jetpack' ) } />
				</ToggleGroupControl>
				<ColorGradientControl
					label={ __( 'Active tab background', 'jetpack' ) }
					colorValue={ activeTabBackgroundColor }
					onColorChange={ set.activeTabBackgroundColor }
				/>
				<ColorGradientControl
					label={ __( 'Active tab text', 'jetpack' ) }
					colorValue={ activeTabTextColor }
					onColorChange={ set.activeTabTextColor }
				/>
				<ColorGradientControl
					label={ __( 'Inactive tab background', 'jetpack' ) }
					colorValue={ inactiveTabBackgroundColor }
					onColorChange={ set.inactiveTabBackgroundColor }
				/>
				<ColorGradientControl
					label={ __( 'Inactive tab text', 'jetpack' ) }
					colorValue={ inactiveTabTextColor }
					onColorChange={ set.inactiveTabTextColor }
				/>
				<ColorGradientControl
					label={ __( 'Tab border', 'jetpack' ) }
					colorValue={ tabBorderColor }
					onColorChange={ set.tabBorderColor }
				/>
				<ContrastChecker
					backgroundColor={ activeTabBackgroundColor }
					textColor={ activeTabTextColor }
				/>
				<ContrastChecker
					backgroundColor={ inactiveTabBackgroundColor }
					textColor={ inactiveTabTextColor }
				/>
				<FontSizePicker
					value={ tabFontSize }
					onChange={ set.tabFontSize }
					__nextHasNoMarginBottom={ true }
					__next40pxDefaultSize={ true }
				/>
				<BoxControl
					label={ __( 'Tab padding', 'jetpack' ) }
					values={ tabPadding }
					onChange={ set.tabPadding }
					__next40pxDefaultSize={ true }
				/>
			</PanelBody>
			<PanelColorSettings
				title={ __( 'Selected amount', 'jetpack' ) }
				initialOpen={ false }
				colorSettings={ selectedAmountColorSettings }
			>
				<ContrastChecker
					backgroundColor={ selectedAmountBackgroundColor }
					textColor={ selectedAmountTextColor }
				/>
			</PanelColorSettings>
			<PanelBody title={ __( 'Donate button', 'jetpack' ) } initialOpen={ false }>
				<FontSizePicker
					value={ buttonFontSize }
					onChange={ set.buttonFontSize }
					__nextHasNoMarginBottom={ true }
					__next40pxDefaultSize={ true }
				/>
				<BoxControl
					label={ __( 'Button padding', 'jetpack' ) }
					values={ buttonPadding }
					onChange={ set.buttonPadding }
					__next40pxDefaultSize={ true }
				/>
				<ToggleGroupControl
					label={ __( 'Button alignment', 'jetpack' ) }
					value={ buttonAlignment || '' }
					onChange={ set.buttonAlignment }
					isBlock
					__next40pxDefaultSize
					__nextHasNoMarginBottom
				>
					<ToggleGroupControlOption value="left" label={ __( 'Left', 'jetpack' ) } />
					<ToggleGroupControlOption value="center" label={ __( 'Center', 'jetpack' ) } />
					<ToggleGroupControlOption value="right" label={ __( 'Right', 'jetpack' ) } />
					<ToggleGroupControlOption value="full" label={ __( 'Full width', 'jetpack' ) } />
				</ToggleGroupControl>
			</PanelBody>
		</InspectorControls>
	);
};

export default StyleControls;
