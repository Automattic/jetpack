import {
	ContrastChecker,
	FontSizePicker,
	InspectorControls,
	__experimentalBorderRadiusControl as BorderRadiusControl, // eslint-disable-line @wordpress/no-unsafe-wp-apis
	__experimentalColorGradientControl as ColorGradientControl, // eslint-disable-line @wordpress/no-unsafe-wp-apis
} from '@wordpress/block-editor';
import {
	BorderBoxControl,
	BoxControl,
	Button,
	ColorIndicator,
	Dropdown,
	Flex,
	FlexItem,
	PanelBody,
	TabPanel,
	__experimentalDropdownContentWrapper as DropdownContentWrapper, // eslint-disable-line @wordpress/no-unsafe-wp-apis
	__experimentalHStack as HStack, // eslint-disable-line @wordpress/no-unsafe-wp-apis
	__experimentalToggleGroupControl as ToggleGroupControl, // eslint-disable-line @wordpress/no-unsafe-wp-apis
	__experimentalToggleGroupControlOption as ToggleGroupControlOption, // eslint-disable-line @wordpress/no-unsafe-wp-apis
	__experimentalToolsPanel as ToolsPanel, // eslint-disable-line @wordpress/no-unsafe-wp-apis
	__experimentalToolsPanelItem as ToolsPanelItem, // eslint-disable-line @wordpress/no-unsafe-wp-apis
	__experimentalZStack as ZStack, // eslint-disable-line @wordpress/no-unsafe-wp-apis
} from '@wordpress/components';
import { useCallback, useMemo } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * One row of color settings, modeled after the standard Color panel's "Button"
 * row: a label + 1–N small color swatches that opens a popover with full
 * pickers when clicked. Used for grouping related colors (e.g. Active tab's
 * background + text) so they read as a single conceptual setting.
 */
const COMPOUND_POPOVER_PROPS = { placement: 'left-start', offset: 36 };

/**
 * Render a row in our color settings panels with the same look as the
 * standard "Color (Block support panel)" rows: a labeled-indicators toggle
 * button (slightly overlapping swatches via ZStack with offset:-8) inside a
 * ToolsPanelItem so that the standard
 * `block-editor-tools-panel-color-gradient-settings__item` styles (borders,
 * rounded corners, kebab-menu reset) apply for free.
 *
 * Accepts 1+ settings; one setting renders one swatch, two render an
 * overlapping pair (matches the standard "Button" row).
 *
 * @param {object}   props          - Component props.
 * @param {string}   props.label    - Row label shown next to the swatches.
 * @param {object[]} props.settings - Color settings for this row, each with `label`, `value`, `onChange`.
 * @return {Element} The rendered ToolsPanelItem.
 */
const CompoundColorRow = ( { label, settings } ) => {
	const hasValue = useCallback( () => settings.some( s => !! s.value ), [ settings ] );
	const onDeselect = useCallback( () => settings.forEach( s => s.onChange() ), [ settings ] );

	const renderToggle = useCallback(
		( { isOpen, onToggle } ) => (
			<Button
				onClick={ onToggle }
				aria-expanded={ isOpen }
				aria-label={ label }
				__next40pxDefaultSize
			>
				<HStack justify="flex-start">
					<ZStack isLayered={ false } offset={ -8 }>
						{ settings.map( ( s, i ) => (
							<Flex key={ i } expanded={ false }>
								<ColorIndicator colorValue={ s.value } />
							</Flex>
						) ) }
					</ZStack>
					<FlexItem className="block-editor-panel-color-gradient-settings__color-name">
						{ label }
					</FlexItem>
				</HStack>
			</Button>
		),
		[ label, settings ]
	);

	const renderContent = useCallback( () => {
		if ( settings.length === 1 ) {
			return (
				<DropdownContentWrapper paddingSize="medium">
					<ColorGradientControl
						label={ settings[ 0 ].label }
						colorValue={ settings[ 0 ].value }
						onColorChange={ settings[ 0 ].onChange }
					/>
				</DropdownContentWrapper>
			);
		}
		// 2+ settings: tabbed UI matching the standard "Button" row.
		const tabs = settings.map( s => ( {
			name: s.label.toLowerCase().replace( /\s+/g, '-' ),
			title: s.label,
		} ) );
		return (
			<DropdownContentWrapper paddingSize="none">
				<TabPanel tabs={ tabs }>
					{ tab => {
						const setting = settings.find(
							s => s.label.toLowerCase().replace( /\s+/g, '-' ) === tab.name
						);
						return (
							<ColorGradientControl
								label={ setting.label }
								colorValue={ setting.value }
								onColorChange={ setting.onChange }
								showTitle={ false }
							/>
						);
					} }
				</TabPanel>
			</DropdownContentWrapper>
		);
	}, [ settings ] );

	return (
		<ToolsPanelItem
			className="block-editor-tools-panel-color-gradient-settings__item"
			label={ label }
			hasValue={ hasValue }
			onDeselect={ onDeselect }
			isShownByDefault
		>
			<Dropdown
				popoverProps={ COMPOUND_POPOVER_PROPS }
				className="block-editor-tools-panel-color-gradient-settings__dropdown"
				renderToggle={ renderToggle }
				renderContent={ renderContent }
			/>
		</ToolsPanelItem>
	);
};

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

	const activeTabSettings = useMemo(
		() => [
			{
				label: __( 'Background', 'jetpack' ),
				value: activeTabBackgroundColor,
				onChange: set.activeTabBackgroundColor,
			},
			{
				label: __( 'Text', 'jetpack' ),
				value: activeTabTextColor,
				onChange: set.activeTabTextColor,
			},
		],
		[ activeTabBackgroundColor, activeTabTextColor, set ]
	);

	const inactiveTabSettings = useMemo(
		() => [
			{
				label: __( 'Background', 'jetpack' ),
				value: inactiveTabBackgroundColor,
				onChange: set.inactiveTabBackgroundColor,
			},
			{
				label: __( 'Text', 'jetpack' ),
				value: inactiveTabTextColor,
				onChange: set.inactiveTabTextColor,
			},
		],
		[ inactiveTabBackgroundColor, inactiveTabTextColor, set ]
	);

	const tabBorderSettings = useMemo(
		() => [
			{
				label: __( 'Tab border', 'jetpack' ),
				value: tabBorderColor,
				onChange: set.tabBorderColor,
			},
		],
		[ tabBorderColor, set ]
	);

	const selectedAmountSettings = useMemo(
		() => [
			{
				label: __( 'Background', 'jetpack' ),
				value: selectedAmountBackgroundColor,
				onChange: set.selectedAmountBackgroundColor,
			},
			{
				label: __( 'Text', 'jetpack' ),
				value: selectedAmountTextColor,
				onChange: set.selectedAmountTextColor,
			},
		],
		[ selectedAmountBackgroundColor, selectedAmountTextColor, set ]
	);

	const resetTabColors = useCallback( () => {
		set.activeTabBackgroundColor();
		set.activeTabTextColor();
		set.inactiveTabBackgroundColor();
		set.inactiveTabTextColor();
		set.tabBorderColor();
	}, [ set ] );

	const resetAmountColors = useCallback( () => {
		set.selectedAmountBackgroundColor();
		set.selectedAmountTextColor();
	}, [ set ] );

	return (
		<InspectorControls group="styles">
			<PanelBody
				title={ __( 'Tabs', 'jetpack' ) }
				initialOpen={ false }
				className="jp-donations-style-panel"
			>
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
				<ToolsPanel
					className="color-block-support-panel"
					label={ __( 'Tab colors', 'jetpack' ) }
					resetAll={ resetTabColors }
					hasInnerWrapper
					headingLevel={ 3 }
					__experimentalFirstVisibleItemClass="first"
					__experimentalLastVisibleItemClass="last"
				>
					<div className="color-block-support-panel__inner-wrapper">
						<CompoundColorRow
							label={ __( 'Active tab', 'jetpack' ) }
							settings={ activeTabSettings }
						/>
						<CompoundColorRow
							label={ __( 'Inactive tab', 'jetpack' ) }
							settings={ inactiveTabSettings }
						/>
						<CompoundColorRow
							label={ __( 'Tab border', 'jetpack' ) }
							settings={ tabBorderSettings }
						/>
					</div>
				</ToolsPanel>
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
			<PanelBody
				title={ __( 'Amounts', 'jetpack' ) }
				initialOpen={ false }
				className="jp-donations-style-panel"
			>
				<ToolsPanel
					className="color-block-support-panel"
					label={ __( 'Amount colors', 'jetpack' ) }
					resetAll={ resetAmountColors }
					hasInnerWrapper
					headingLevel={ 3 }
					__experimentalFirstVisibleItemClass="first"
					__experimentalLastVisibleItemClass="last"
				>
					<div className="color-block-support-panel__inner-wrapper">
						<CompoundColorRow
							label={ __( 'Selected amount', 'jetpack' ) }
							settings={ selectedAmountSettings }
						/>
					</div>
				</ToolsPanel>
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
			<PanelBody
				title={ __( 'Donate button', 'jetpack' ) }
				initialOpen={ false }
				className="jp-donations-style-panel"
			>
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
