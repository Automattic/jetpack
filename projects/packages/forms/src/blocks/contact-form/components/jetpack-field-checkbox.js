import {
	FontSizePicker,
	InspectorControls,
	BlockControls,
	useBlockProps,
	__experimentalColorGradientSettingsDropdown as ColorGradientSettingsDropdown, // eslint-disable-line @wordpress/no-unsafe-wp-apis
	__experimentalUseMultipleOriginColorsAndGradients as useMultipleOriginColorsAndGradients, // eslint-disable-line @wordpress/no-unsafe-wp-apis
} from '@wordpress/block-editor';
import {
	PanelBody,
	ToggleControl,
	__experimentalToolsPanel as ToolsPanel, // eslint-disable-line @wordpress/no-unsafe-wp-apis
	__experimentalToolsPanelItem as ToolsPanelItem, // eslint-disable-line @wordpress/no-unsafe-wp-apis
} from '@wordpress/components';
import { compose, withInstanceId } from '@wordpress/compose';
import { __ } from '@wordpress/i18n';
import useToolsPanelResponsiveDropdownProps from '../util/use-tool-panel-responsive-dropdown-props';
import { withSharedFieldAttributes } from '../util/with-shared-field-attributes';
import ToolbarRequiredGroup from './block-controls/toolbar-required-group';
import JetpackFieldDimensionControls from './jetpack-field-dimension-controls';
import JetpackFieldLabel from './jetpack-field-label';
import JetpackManageResponsesSettings from './jetpack-manage-responses-settings';
import { useJetpackFieldStyles } from './use-jetpack-field-styles';

function JetpackFieldCheckbox( {
	clientId,
	instanceId,
	required,
	requiredText,
	label,
	setAttributes,
	width,
	defaultValue,
	attributes,
	insertBlocksAfter,
} ) {
	const { blockStyle } = useJetpackFieldStyles( attributes );
	const blockProps = useBlockProps( {
		id: `jetpack-field-checkbox-${ instanceId }`,
		className: 'jetpack-field jetpack-field-checkbox',
		style: blockStyle,
	} );
	const toolsPanelDropdownMenuProps = useToolsPanelResponsiveDropdownProps();

	return (
		<>
			<BlockControls>
				<ToolbarRequiredGroup
					required={ required }
					onClick={ () => setAttributes( { required: ! required } ) }
				/>
			</BlockControls>

			<div { ...blockProps }>
				<input
					className="jetpack-field-checkbox__checkbox"
					type="checkbox"
					disabled
					checked={ defaultValue }
				/>
				<JetpackFieldLabel
					required={ required }
					requiredText={ requiredText }
					label={ label }
					setAttributes={ setAttributes }
					attributes={ attributes }
					insertBlocksAfter={ insertBlocksAfter }
				/>
				<InspectorControls>
					<PanelBody title={ __( 'Checkbox Settings', 'jetpack-forms' ) }>
						<ToggleControl
							label={ __( 'Checked by default', 'jetpack-forms' ) }
							checked={ defaultValue }
							onChange={ value => setAttributes( { defaultValue: value ? 'true' : '' } ) }
							__nextHasNoMarginBottom={ true }
						/>
					</PanelBody>
				</InspectorControls>
				<JetpackFieldDimensionControls
					clientId={ clientId }
					setAttributes={ setAttributes }
					width={ width }
				/>
				<InspectorControls group="styles">
					<ToolsPanel
						panelId={ clientId }
						label={ __( 'Color', 'jetpack-forms' ) }
						resetAll={ () => setAttributes( { labelColor: undefined } ) }
						dropdownMenuProps={ toolsPanelDropdownMenuProps }
					>
						<div className="jetpack-field-controls__color-settings">
							<ColorGradientSettingsDropdown
								__experimentalIsRenderedInSidebar
								panelId={ clientId }
								gradients={ [] }
								disableCustomGradients
								settings={ [
									{
										colorValue: attributes.labelColor,
										onColorChange: value => setAttributes( { labelColor: value } ),
										label: __( 'Label Text', 'jetpack-forms' ),
										clearable: true,
									},
								] }
								{ ...useMultipleOriginColorsAndGradients() }
							/>
						</div>
					</ToolsPanel>
					<ToolsPanel
						panelId={ clientId }
						label={ __( 'Label Typography', 'jetpack-forms' ) }
						resetAll={ () => setAttributes( { labelFontSize: undefined } ) }
						dropdownMenuProps={ toolsPanelDropdownMenuProps }
					>
						<ToolsPanelItem
							panelId={ clientId }
							hasValue={ () => !! attributes.labelFontSize }
							label={ __( 'Size', 'jetpack-forms' ) }
							onDeselect={ () =>
								setAttributes( {
									labelFontSize: undefined,
								} )
							}
						>
							<FontSizePicker
								withSlider
								withReset={ true }
								size="__unstable-large"
								__nextHasNoMarginBottom
								onChange={ labelFontSize => setAttributes( { labelFontSize } ) }
								value={ attributes.labelFontSize }
							/>
						</ToolsPanelItem>
					</ToolsPanel>
					<ToolsPanel>
						<div style={ { gridColumn: '1 / -1' } }>
							<ToggleControl
								label={ __( 'Sync field styles', 'jetpack-forms' ) }
								checked={ attributes.shareFieldAttributes }
								onChange={ value => setAttributes( { shareFieldAttributes: value } ) }
								help={ __(
									'Syncs all styles except for Width. Deactivate for individual styling of this block.',
									'jetpack-forms'
								) }
								__nextHasNoMarginBottom={ true }
							/>
						</div>
					</ToolsPanel>
				</InspectorControls>
				<InspectorControls>
					<PanelBody title={ __( 'Manage Responses', 'jetpack-forms' ) }>
						<JetpackManageResponsesSettings isChildBlock />
					</PanelBody>
					<PanelBody title={ __( 'Field Settings', 'jetpack-forms' ) }>
						<ToggleControl
							label={ __( 'Field is required', 'jetpack-forms' ) }
							checked={ required }
							onChange={ value => setAttributes( { required: value } ) }
							help={ __( 'You can edit the "required" label in the editor', 'jetpack-forms' ) }
							__nextHasNoMarginBottom={ true }
						/>
					</PanelBody>
				</InspectorControls>
			</div>
		</>
	);
}

export default compose(
	withSharedFieldAttributes( [
		'borderRadius',
		'borderWidth',
		'labelFontSize',
		'fieldFontSize',
		'lineHeight',
		'labelLineHeight',
		'inputColor',
		'labelColor',
		'fieldBackgroundColor',
		'borderColor',
	] ),
	withInstanceId
)( JetpackFieldCheckbox );
