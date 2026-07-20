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
	PanelRow,
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
				<DropdownContentWrapper paddingSize="none">
					<div className="block-editor-panel-color-gradient-settings__dropdown-content">
						<ColorGradientControl
							label={ settings[ 0 ].label }
							colorValue={ settings[ 0 ].value }
							onColorChange={ settings[ 0 ].onChange }
						/>
					</div>
				</DropdownContentWrapper>
			);
		}
		// 2+ settings: tabbed UI matching the standard "Button" row. The
		// `block-editor-panel-color-gradient-settings__dropdown-content` wrapper
		// is required for core CSS to set the picker to width: 260px / padding: 16px.
		const tabs = settings.map( s => ( {
			name: s.label.toLowerCase().replace( /\s+/g, '-' ),
			title: s.label,
		} ) );
		return (
			<DropdownContentWrapper paddingSize="none">
				<div className="block-editor-panel-color-gradient-settings__dropdown-content">
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
				</div>
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
		selectedAmountOutlineColor,
		tabsAppearance,
		tabBorderColor,
		tabFontSize,
		tabPadding,
		buttonFontSize,
		buttonPadding,
		buttonAlignment,
		buttonBorderRadius,
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
			selectedAmountOutlineColor: make( 'selectedAmountOutlineColor' ),
			amountFontSize: make( 'amountFontSize' ),
			amountBorder: make( 'amountBorder' ),
			amountBorderRadius: make( 'amountBorderRadius' ),
			buttonFontSize: make( 'buttonFontSize' ),
			buttonPadding: make( 'buttonPadding' ),
			buttonAlignment: value => setAttributes( { buttonAlignment: value || '' } ),
			buttonBorderRadius: make( 'buttonBorderRadius' ),
		};
	}, [ setAttributes ] );

	const activeTabSettings = useMemo(
		() => [
			{
				label: __( 'Text', 'jetpack' ),
				value: activeTabTextColor,
				onChange: set.activeTabTextColor,
			},
			{
				label: __( 'Background', 'jetpack' ),
				value: activeTabBackgroundColor,
				onChange: set.activeTabBackgroundColor,
			},
		],
		[ activeTabBackgroundColor, activeTabTextColor, set ]
	);

	const inactiveTabSettings = useMemo(
		() => [
			{
				label: __( 'Text', 'jetpack' ),
				value: inactiveTabTextColor,
				onChange: set.inactiveTabTextColor,
			},
			{
				label: __( 'Background', 'jetpack' ),
				value: inactiveTabBackgroundColor,
				onChange: set.inactiveTabBackgroundColor,
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
				label: __( 'Text', 'jetpack' ),
				value: selectedAmountTextColor,
				onChange: set.selectedAmountTextColor,
			},
			{
				label: __( 'Background', 'jetpack' ),
				value: selectedAmountBackgroundColor,
				onChange: set.selectedAmountBackgroundColor,
			},
			{
				label: __( 'Outline', 'jetpack' ),
				value: selectedAmountOutlineColor,
				onChange: set.selectedAmountOutlineColor,
			},
		],
		[ selectedAmountBackgroundColor, selectedAmountTextColor, selectedAmountOutlineColor, set ]
	);

	const noop = useCallback( () => {}, [] );

	const resetAllTabs = useCallback( () => {
		set.tabsAppearance( 'tabs' );
		set.activeTabBackgroundColor();
		set.activeTabTextColor();
		set.inactiveTabBackgroundColor();
		set.inactiveTabTextColor();
		set.tabBorderColor();
		set.tabFontSize();
		set.tabPadding();
	}, [ set ] );

	const resetAllAmounts = useCallback( () => {
		set.selectedAmountBackgroundColor();
		set.selectedAmountTextColor();
		set.selectedAmountOutlineColor();
		set.amountFontSize();
		set.amountBorder();
		set.amountBorderRadius();
	}, [ set ] );

	const resetAllButton = useCallback( () => {
		set.buttonFontSize();
		set.buttonPadding();
		set.buttonBorderRadius();
		set.buttonAlignment( '' );
	}, [ set ] );

	// Stable hasValue / onDeselect callbacks for each ToolsPanelItem so JSX
	// props don't recreate functions on every render (react/jsx-no-bind).
	const has = useMemo(
		() => ( {
			tabsAppearance: () => tabsAppearance === 'buttons',
			tabFontSize: () => !! tabFontSize,
			tabPadding: () => !! tabPadding,
			amountFontSize: () => !! amountFontSize,
			amountBorder: () => !! amountBorder,
			amountBorderRadius: () => !! amountBorderRadius,
			buttonFontSize: () => !! buttonFontSize,
			buttonPadding: () => !! buttonPadding,
			buttonAlignment: () => !! buttonAlignment,
			buttonBorderRadius: () => !! buttonBorderRadius,
		} ),
		[
			tabsAppearance,
			tabFontSize,
			tabPadding,
			amountFontSize,
			amountBorder,
			amountBorderRadius,
			buttonFontSize,
			buttonPadding,
			buttonAlignment,
			buttonBorderRadius,
		]
	);

	const deselect = useMemo(
		() => ( {
			tabsAppearance: () => set.tabsAppearance( 'tabs' ),
			buttonAlignment: () => set.buttonAlignment( '' ),
		} ),
		[ set ]
	);

	return (
		<InspectorControls group="styles">
			<PanelBody
				title={ __( 'Tabs', 'jetpack' ) }
				initialOpen={ false }
				className="jp-donations-style-panel"
			>
				<ToolsPanel
					label={ __( 'Tab appearance', 'jetpack' ) }
					resetAll={ noop }
					headingLevel={ 3 }
					__experimentalFirstVisibleItemClass="first"
					__experimentalLastVisibleItemClass="last"
				>
					<ToolsPanelItem
						label={ __( 'Appearance', 'jetpack' ) }
						hasValue={ has.tabsAppearance }
						onDeselect={ deselect.tabsAppearance }
						isShownByDefault
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
					</ToolsPanelItem>
				</ToolsPanel>
				<ToolsPanel
					className="color-block-support-panel"
					label={ __( 'Colors', 'jetpack' ) }
					resetAll={ noop }
					hasInnerWrapper
					headingLevel={ 3 }
					__experimentalFirstVisibleItemClass="first"
					__experimentalLastVisibleItemClass="last"
				>
					<div className="color-block-support-panel__inner-wrapper">
						<CompoundColorRow
							label={ __( 'Active Tab', 'jetpack' ) }
							settings={ activeTabSettings }
						/>
						<CompoundColorRow
							label={ __( 'Inactive Tab', 'jetpack' ) }
							settings={ inactiveTabSettings }
						/>
						<CompoundColorRow
							label={ __( 'Tab Border', 'jetpack' ) }
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
				<ToolsPanel
					label={ __( 'Tab dimensions', 'jetpack' ) }
					resetAll={ noop }
					headingLevel={ 3 }
					__experimentalFirstVisibleItemClass="first"
					__experimentalLastVisibleItemClass="last"
				>
					<ToolsPanelItem
						label={ __( 'Font size', 'jetpack' ) }
						hasValue={ has.tabFontSize }
						onDeselect={ set.tabFontSize }
						isShownByDefault
					>
						<FontSizePicker
							value={ tabFontSize }
							onChange={ set.tabFontSize }
							__nextHasNoMarginBottom={ true }
							__next40pxDefaultSize={ true }
						/>
					</ToolsPanelItem>
					<ToolsPanelItem
						label={ __( 'Padding', 'jetpack' ) }
						hasValue={ has.tabPadding }
						onDeselect={ set.tabPadding }
						isShownByDefault
					>
						<BoxControl
							label={ __( 'Padding', 'jetpack' ) }
							values={ tabPadding }
							onChange={ set.tabPadding }
							allowReset={ false }
							__next40pxDefaultSize={ true }
						/>
					</ToolsPanelItem>
				</ToolsPanel>
				<PanelRow>
					<Button variant="secondary" onClick={ resetAllTabs }>
						{ __( 'Reset', 'jetpack' ) }
					</Button>
				</PanelRow>
			</PanelBody>
			<PanelBody
				title={ __( 'Amounts', 'jetpack' ) }
				initialOpen={ false }
				className="jp-donations-style-panel"
			>
				<ToolsPanel
					className="color-block-support-panel"
					label={ __( 'Colors', 'jetpack' ) }
					resetAll={ noop }
					hasInnerWrapper
					headingLevel={ 3 }
					__experimentalFirstVisibleItemClass="first"
					__experimentalLastVisibleItemClass="last"
				>
					<div className="color-block-support-panel__inner-wrapper">
						<CompoundColorRow
							label={ __( 'Selected Amount', 'jetpack' ) }
							settings={ selectedAmountSettings }
						/>
					</div>
				</ToolsPanel>
				<ContrastChecker
					backgroundColor={ selectedAmountBackgroundColor }
					textColor={ selectedAmountTextColor }
				/>
				<ToolsPanel
					label={ __( 'Amount settings', 'jetpack' ) }
					resetAll={ noop }
					headingLevel={ 3 }
					__experimentalFirstVisibleItemClass="first"
					__experimentalLastVisibleItemClass="last"
				>
					<ToolsPanelItem
						label={ __( 'Font size', 'jetpack' ) }
						hasValue={ has.amountFontSize }
						onDeselect={ set.amountFontSize }
						isShownByDefault
					>
						<FontSizePicker
							value={ amountFontSize }
							onChange={ set.amountFontSize }
							__nextHasNoMarginBottom={ true }
							__next40pxDefaultSize={ true }
						/>
					</ToolsPanelItem>
					<ToolsPanelItem
						label={ __( 'Border', 'jetpack' ) }
						hasValue={ has.amountBorder }
						onDeselect={ set.amountBorder }
						isShownByDefault
					>
						<BorderBoxControl
							label={ __( 'Border', 'jetpack' ) }
							value={ amountBorder }
							onChange={ set.amountBorder }
							enableAlpha
							enableStyle
							__next40pxDefaultSize
						/>
					</ToolsPanelItem>
					<ToolsPanelItem
						label={ __( 'Border radius', 'jetpack' ) }
						hasValue={ has.amountBorderRadius }
						onDeselect={ set.amountBorderRadius }
						isShownByDefault
					>
						<BorderRadiusControl
							values={ amountBorderRadius }
							onChange={ set.amountBorderRadius }
						/>
					</ToolsPanelItem>
				</ToolsPanel>
				<PanelRow>
					<Button variant="secondary" onClick={ resetAllAmounts }>
						{ __( 'Reset', 'jetpack' ) }
					</Button>
				</PanelRow>
			</PanelBody>
			<PanelBody
				title={ __( 'Donate button', 'jetpack' ) }
				initialOpen={ false }
				className="jp-donations-style-panel"
			>
				<ToolsPanel
					label={ __( 'Button settings', 'jetpack' ) }
					resetAll={ noop }
					headingLevel={ 3 }
					__experimentalFirstVisibleItemClass="first"
					__experimentalLastVisibleItemClass="last"
				>
					<ToolsPanelItem
						label={ __( 'Font size', 'jetpack' ) }
						hasValue={ has.buttonFontSize }
						onDeselect={ set.buttonFontSize }
						isShownByDefault
					>
						<FontSizePicker
							value={ buttonFontSize }
							onChange={ set.buttonFontSize }
							__nextHasNoMarginBottom={ true }
							__next40pxDefaultSize={ true }
						/>
					</ToolsPanelItem>
					<ToolsPanelItem
						label={ __( 'Padding', 'jetpack' ) }
						hasValue={ has.buttonPadding }
						onDeselect={ set.buttonPadding }
						isShownByDefault
					>
						<BoxControl
							label={ __( 'Padding', 'jetpack' ) }
							values={ buttonPadding }
							onChange={ set.buttonPadding }
							allowReset={ false }
							__next40pxDefaultSize={ true }
						/>
					</ToolsPanelItem>
					<ToolsPanelItem
						label={ __( 'Radius', 'jetpack' ) }
						hasValue={ has.buttonBorderRadius }
						onDeselect={ set.buttonBorderRadius }
						isShownByDefault
					>
						<BorderRadiusControl
							values={ buttonBorderRadius }
							onChange={ set.buttonBorderRadius }
						/>
					</ToolsPanelItem>
					<ToolsPanelItem
						label={ __( 'Alignment', 'jetpack' ) }
						hasValue={ has.buttonAlignment }
						onDeselect={ deselect.buttonAlignment }
						isShownByDefault
					>
						<ToggleGroupControl
							label={ __( 'Alignment', 'jetpack' ) }
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
					</ToolsPanelItem>
				</ToolsPanel>
				<PanelRow>
					<Button variant="secondary" onClick={ resetAllButton }>
						{ __( 'Reset', 'jetpack' ) }
					</Button>
				</PanelRow>
			</PanelBody>
		</InspectorControls>
	);
};

export default StyleControls;
