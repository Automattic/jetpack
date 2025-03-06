import {
	FontSizePicker,
	InspectorAdvancedControls,
	InspectorControls,
	LineHeightControl,
	BlockControls,
	__experimentalColorGradientSettingsDropdown as ColorGradientSettingsDropdown, // eslint-disable-line @wordpress/no-unsafe-wp-apis
	__experimentalUseMultipleOriginColorsAndGradients as useMultipleOriginColorsAndGradients, // eslint-disable-line @wordpress/no-unsafe-wp-apis
} from '@wordpress/block-editor';
import {
	PanelBody,
	TextControl,
	ToggleControl,
	RangeControl,
	__experimentalToolsPanel as ToolsPanel, // eslint-disable-line @wordpress/no-unsafe-wp-apis
	__experimentalToolsPanelItem as ToolsPanelItem, // eslint-disable-line @wordpress/no-unsafe-wp-apis
} from '@wordpress/components';
import { isValidElement } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { useFormStyle, FORM_STYLE, getBlockStyle } from '../util/form';
import useToolsPanelResponsiveDropdownProps from '../util/use-tool-panel-responsive-dropdown-props';
import ToolbarRequiredGroup from './block-controls/toolbar-required-group';
import JetpackFieldDimensionControls from './jetpack-field-dimension-controls';
import JetpackManageResponsesSettings from './jetpack-manage-responses-settings';

const JetpackFieldControls = ( {
	attributes,
	blockClassNames,
	clientId,
	id,
	placeholder,
	placeholderField = 'placeholder',
	hidePlaceholder,
	required,
	setAttributes,
	type,
	width,
	extraFieldSettings = [],
} ) => {
	const formStyle = useFormStyle( clientId );
	const blockStyle = getBlockStyle( blockClassNames );
	const isChoicesBlock = [ 'radio', 'checkbox' ].includes( type );
	const toolsPanelDropdownMenuProps = useToolsPanelResponsiveDropdownProps();

	const setNumberAttribute =
		( key, parse = parseInt ) =>
		value => {
			const parsedValue = parse( value, 10 );

			setAttributes( {
				[ key ]: ! isNaN( parsedValue ) ? parsedValue : undefined,
			} );
		};

	const optionColorLabel =
		blockStyle === 'button'
			? __( 'Button Text', 'jetpack-forms' )
			: __( 'Option Text', 'jetpack-forms', 0 );
	const inputColorLabel = isChoicesBlock
		? optionColorLabel
		: __( 'Field Text', 'jetpack-forms', 0 );
	const backgroundColorLabel = isChoicesBlock
		? __( 'Background', 'jetpack-forms' )
		: __( 'Field Background', 'jetpack-forms', 0 );

	const colorSettings = [
		{
			colorValue: attributes.labelColor,
			onColorChange: value => setAttributes( { labelColor: value } ),
			label: __( 'Label Text', 'jetpack-forms' ),
			clearable: true,
		},
		{
			colorValue: attributes.inputColor,
			onColorChange: value => setAttributes( { inputColor: value } ),
			label: inputColorLabel,
			clearable: true,
		},
	];

	if ( isChoicesBlock && blockStyle === 'button' ) {
		colorSettings.push( {
			colorValue: attributes.buttonBackgroundColor,
			onColorChange: value => setAttributes( { buttonBackgroundColor: value } ),
			label: __( 'Button Background', 'jetpack-forms' ),
			clearable: true,
		} );
	}

	if ( ! isChoicesBlock || formStyle === FORM_STYLE.OUTLINED ) {
		colorSettings.push( {
			colorValue: attributes.fieldBackgroundColor,
			onColorChange: value => setAttributes( { fieldBackgroundColor: value } ),
			label: backgroundColorLabel,
			clearable: true,
		} );

		colorSettings.push( {
			colorValue: attributes.borderColor,
			onColorChange: value => setAttributes( { borderColor: value } ),
			label: __( 'Border', 'jetpack-forms' ),
			clearable: true,
		} );
	}

	const setId = value => {
		const newValue = value.replace( /[^a-zA-Z0-9_-]/g, '' );
		setAttributes( { id: newValue } );
	};

	let fieldSettings = [
		<ToggleControl
			key="required"
			label={ __( 'Field is required', 'jetpack-forms' ) }
			checked={ required }
			onChange={ value => setAttributes( { required: value } ) }
			help={ __( 'You can edit the "required" label in the editor', 'jetpack-forms' ) }
			__nextHasNoMarginBottom={ true }
		/>,
		! hidePlaceholder && (
			<TextControl
				key="placeholderField"
				label={ __( 'Placeholder text', 'jetpack-forms' ) }
				value={ placeholder || '' }
				onChange={ value => setAttributes( { [ placeholderField ]: value } ) }
				help={ __(
					'Show visitors an example of the type of content expected. Otherwise, leave blank.',
					'jetpack-forms'
				) }
				__nextHasNoMarginBottom={ true }
				__next40pxDefaultSize={ true }
			/>
		),
	];

	extraFieldSettings.forEach( ( { element, index } ) => {
		if ( ! isValidElement( element ) ) {
			return;
		}

		if ( index >= 0 && index < fieldSettings.length ) {
			fieldSettings = [
				...fieldSettings.slice( 0, index ),
				element,
				...fieldSettings.slice( index ),
			];
		} else {
			fieldSettings.push( element );
		}
	} );

	return (
		<>
			<BlockControls>
				<ToolbarRequiredGroup
					required={ required }
					onClick={ () => setAttributes( { required: ! required } ) }
				/>
			</BlockControls>
			<InspectorControls>
				<PanelBody title={ __( 'Manage Responses', 'jetpack-forms' ) }>
					<JetpackManageResponsesSettings isChildBlock />
				</PanelBody>
				<PanelBody title={ __( 'Field Settings', 'jetpack-forms' ) }>
					<>{ fieldSettings }</>
				</PanelBody>
			</InspectorControls>
			<JetpackFieldDimensionControls
				clientId={ clientId }
				setAttributes={ setAttributes }
				width={ width }
			/>
			<InspectorControls group="styles">
				<PanelBody>
					<ToggleControl
						label={ __( 'Apply styling to all fields', 'jetpack-forms' ) }
						checked={ attributes.shareFieldAttributes }
						onChange={ value => setAttributes( { shareFieldAttributes: value } ) }
						help={ __( 'Toggle off if you want to style this block only.', 'jetpack-forms' ) }
						__nextHasNoMarginBottom={ true }
					/>
				</PanelBody>
				<ToolsPanel
					label={ __( 'Color', 'jetpack-forms' ) }
					panelId={ clientId }
					dropdownMenuProps={ toolsPanelDropdownMenuProps }
				>
					<div className="jetpack-field-controls__full-width-control">
						<ColorGradientSettingsDropdown
							__experimentalIsRenderedInSidebar
							settings={ colorSettings }
							panelId={ clientId }
							gradients={ [] }
							disableCustomGradients
							{ ...useMultipleOriginColorsAndGradients() }
						/>
					</div>
				</ToolsPanel>
				<ToolsPanel
					label={
						isChoicesBlock
							? __( 'Options typography', 'jetpack-forms' )
							: __( 'Input typography', 'jetpack-forms', 0 )
					}
					dropdownMenuProps={ toolsPanelDropdownMenuProps }
				>
					<ToolsPanelItem
						hasValue={ () => !! attributes.fieldFontSize }
						label={ __( 'Size', 'jetpack-forms' ) }
						onDeselect={ () =>
							setAttributes( {
								fieldFontSize: undefined,
							} )
						}
						isShownByDefault
					>
						<FontSizePicker
							withReset={ false }
							onChange={ fieldFontSize => setAttributes( { fieldFontSize } ) }
							value={ attributes.fieldFontSize }
							size="__unstable-large"
							__nextHasNoMarginBottom
						/>
					</ToolsPanelItem>
					<ToolsPanelItem
						hasValue={ () => !! attributes.lineHeight }
						label={ __( 'Line height', 'jetpack-forms' ) }
						onDeselect={ () =>
							setAttributes( {
								lineHeight: undefined,
							} )
						}
					>
						<LineHeightControl
							__nextHasNoMarginBottom={ true }
							__unstableInputWidth="100%"
							value={ attributes.lineHeight }
							onChange={ setNumberAttribute( 'lineHeight', parseFloat ) }
							size="__unstable-large"
						/>
					</ToolsPanelItem>
				</ToolsPanel>
				<ToolsPanel
					label={ __( 'Label typography', 'jetpack-forms' ) }
					dropdownMenuProps={ toolsPanelDropdownMenuProps }
				>
					<ToolsPanelItem
						hasValue={ () => !! attributes.labelFontSize }
						label={ __( 'Size', 'jetpack-forms' ) }
						onDeselect={ () =>
							setAttributes( {
								labelFontSize: undefined,
							} )
						}
						isShownByDefault
					>
						<FontSizePicker
							withReset={ true }
							size="__unstable-large"
							__nextHasNoMarginBottom
							onChange={ labelFontSize => setAttributes( { labelFontSize } ) }
							value={ attributes.labelFontSize }
						/>
					</ToolsPanelItem>
					<ToolsPanelItem
						hasValue={ () => !! attributes.labelLineHeight }
						label={ __( 'Line height', 'jetpack-forms' ) }
						onDeselect={ () =>
							setAttributes( {
								labelLineHeight: undefined,
							} )
						}
					>
						<LineHeightControl
							__unstableInputWidth="100%"
							__nextHasNoMarginBottom={ true }
							value={ attributes.labelLineHeight }
							onChange={ setNumberAttribute( 'labelLineHeight', parseFloat ) }
							size="__unstable-large"
						/>
					</ToolsPanelItem>
				</ToolsPanel>
				<ToolsPanel
					label={ __( 'Border', 'jetpack-forms' ) }
					panelId={ clientId }
					dropdownMenuProps={ toolsPanelDropdownMenuProps }
				>
					{ ( isChoicesBlock || blockStyle === 'button' ) && (
						<>
							<ToolsPanelItem
								panelId={ clientId }
								hasValue={ () => typeof attributes.buttonBorderWidth === 'number' }
								label={ __( 'Button Border Width', 'jetpack-forms' ) }
								onDeselect={ () =>
									setAttributes( {
										buttonBorderWidth: undefined,
									} )
								}
							>
								<RangeControl
									label={ __( 'Button Border Width', 'jetpack-forms' ) }
									value={ attributes.buttonBorderWidth }
									initialPosition={ 1 }
									onChange={ setNumberAttribute( 'buttonBorderWidth' ) }
									min={ 0 }
									max={ 100 }
									__nextHasNoMarginBottom={ true }
									__next40pxDefaultSize={ true }
								/>
							</ToolsPanelItem>
							<ToolsPanelItem
								panelId={ clientId }
								hasValue={ () => typeof attributes.buttonBorderRadius === 'number' }
								label={ __( 'Button Border Radius', 'jetpack-forms' ) }
								onDeselect={ () =>
									setAttributes( {
										buttonBorderRadius: undefined,
									} )
								}
							>
								<RangeControl
									label={ __( 'Button Border Radius', 'jetpack-forms' ) }
									value={ attributes.buttonBorderRadius }
									initialPosition={ 0 }
									onChange={ setNumberAttribute( 'buttonBorderRadius' ) }
									min={ 0 }
									max={ 100 }
									__nextHasNoMarginBottom={ true }
									__next40pxDefaultSize={ true }
								/>
							</ToolsPanelItem>
						</>
					) }
					{ ( ! isChoicesBlock || formStyle === FORM_STYLE.OUTLINED ) && (
						<>
							<ToolsPanelItem
								panelId={ clientId }
								hasValue={ () => typeof attributes.borderWidth === 'number' }
								label={ __( 'Border Width', 'jetpack-forms' ) }
								onDeselect={ () =>
									setAttributes( {
										borderWidth: undefined,
									} )
								}
							>
								<RangeControl
									label={ __( 'Border Width', 'jetpack-forms' ) }
									value={ attributes.borderWidth }
									initialPosition={ 1 }
									onChange={ setNumberAttribute( 'borderWidth' ) }
									min={ 0 }
									max={ 100 }
									__nextHasNoMarginBottom={ true }
									__next40pxDefaultSize={ true }
								/>
							</ToolsPanelItem>
							<ToolsPanelItem
								panelId={ clientId }
								hasValue={ () => typeof attributes.borderRadius === 'number' }
								label={ __( 'Border Radius', 'jetpack-forms' ) }
								onDeselect={ () =>
									setAttributes( {
										borderRadius: undefined,
									} )
								}
							>
								<RangeControl
									label={ __( 'Border Radius', 'jetpack-forms' ) }
									value={ attributes.borderRadius }
									initialPosition={ 0 }
									onChange={ setNumberAttribute( 'borderRadius' ) }
									min={ 0 }
									max={ 100 }
									__nextHasNoMarginBottom={ true }
									__next40pxDefaultSize={ true }
								/>
							</ToolsPanelItem>
						</>
					) }
				</ToolsPanel>
			</InspectorControls>
			<InspectorAdvancedControls>
				<TextControl
					label={ __( 'Name/ID', 'jetpack-forms' ) }
					value={ id || '' }
					onChange={ setId }
					help={ __(
						"Customize the input's name/ID. Only alphanumeric, dash and underscore characters are allowed",
						'jetpack-forms'
					) }
					__nextHasNoMarginBottom={ true }
					__next40pxDefaultSize={ true }
				/>
			</InspectorAdvancedControls>
		</>
	);
};

export default JetpackFieldControls;
