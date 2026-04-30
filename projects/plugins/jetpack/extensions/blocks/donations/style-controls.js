import {
	ContrastChecker,
	FontSizePicker,
	InspectorControls,
	PanelColorSettings,
	__experimentalBorderRadiusControl as BorderRadiusControl, // eslint-disable-line @wordpress/no-unsafe-wp-apis
	__experimentalColorGradientControl as ColorGradientControl, // eslint-disable-line @wordpress/no-unsafe-wp-apis
} from '@wordpress/block-editor';
import {
	BorderBoxControl,
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
		amountFontSize,
		amountBorder,
		amountBorderRadius,
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
			amountFontSize: make( 'amountFontSize' ),
			amountBorder: make( 'amountBorder' ),
			amountBorderRadius: make( 'amountBorderRadius' ),
			buttonFontSize: make( 'buttonFontSize' ),
			buttonPadding: make( 'buttonPadding' ),
			buttonAlignment: value => setAttributes( { buttonAlignment: value || '' } ),
		};
	}, [ setAttributes ] );

	const tabColorSettings = useMemo(
		() => [
			{
				label: __( 'Active tab background', 'jetpack' ),
				value: activeTabBackgroundColor,
				onChange: set.activeTabBackgroundColor,
			},
			{
				label: __( 'Active tab text', 'jetpack' ),
				value: activeTabTextColor,
				onChange: set.activeTabTextColor,
			},
			{
				label: __( 'Inactive tab background', 'jetpack' ),
				value: inactiveTabBackgroundColor,
				onChange: set.inactiveTabBackgroundColor,
			},
			{
				label: __( 'Inactive tab text', 'jetpack' ),
				value: inactiveTabTextColor,
				onChange: set.inactiveTabTextColor,
			},
			{
				label: __( 'Tab border', 'jetpack' ),
				value: tabBorderColor,
				onChange: set.tabBorderColor,
			},
		],
		[
			activeTabBackgroundColor,
			activeTabTextColor,
			inactiveTabBackgroundColor,
			inactiveTabTextColor,
			tabBorderColor,
			set,
		]
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
				<PanelColorSettings showTitle={ false } colorSettings={ tabColorSettings }>
					<ContrastChecker
						backgroundColor={ activeTabBackgroundColor }
						textColor={ activeTabTextColor }
					/>
					<ContrastChecker
						backgroundColor={ inactiveTabBackgroundColor }
						textColor={ inactiveTabTextColor }
					/>
				</PanelColorSettings>
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
			<PanelBody title={ __( 'Amounts', 'jetpack' ) } initialOpen={ false }>
				<ColorGradientControl
					label={ __( 'Selected amount background', 'jetpack' ) }
					colorValue={ selectedAmountBackgroundColor }
					onColorChange={ set.selectedAmountBackgroundColor }
				/>
				<ColorGradientControl
					label={ __( 'Selected amount text', 'jetpack' ) }
					colorValue={ selectedAmountTextColor }
					onColorChange={ set.selectedAmountTextColor }
				/>
				<ContrastChecker
					backgroundColor={ selectedAmountBackgroundColor }
					textColor={ selectedAmountTextColor }
				/>
				<FontSizePicker
					value={ amountFontSize }
					onChange={ set.amountFontSize }
					__nextHasNoMarginBottom={ true }
					__next40pxDefaultSize={ true }
				/>
				<BorderBoxControl
					label={ __( 'Border', 'jetpack' ) }
					value={ amountBorder }
					onChange={ set.amountBorder }
					enableAlpha
					enableStyle
					__next40pxDefaultSize
				/>
				<BorderRadiusControl values={ amountBorderRadius } onChange={ set.amountBorderRadius } />
			</PanelBody>
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
