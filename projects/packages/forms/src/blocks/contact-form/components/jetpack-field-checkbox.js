import {
	FontSizePicker,
	InspectorControls,
	BlockControls,
	useBlockProps,
	__experimentalColorGradientSettingsDropdown as ColorGradientSettingsDropdown, // eslint-disable-line @wordpress/no-unsafe-wp-apis
} from '@wordpress/block-editor';
import {
	PanelBody,
	ToggleControl,
	__experimentalToolsPanelItem as ToolsPanelItem, // eslint-disable-line @wordpress/no-unsafe-wp-apis
} from '@wordpress/components';
import { compose, withInstanceId } from '@wordpress/compose';
import { __ } from '@wordpress/i18n';
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
				<InspectorControls group="color">
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
								resetAllFilter: () => setAttributes( { labelColor: undefined } ),
								clearable: true,
							},
						] }
					/>
				</InspectorControls>
				<InspectorControls group="typography">
					<ToolsPanelItem
						panelId={ clientId }
						hasValue={ () => !! attributes.labelFontSize }
						label={ __( 'Size', 'jetpack-forms' ) }
						onDeselect={ () =>
							setAttributes( {
								labelFontSize: undefined,
							} )
						}
						resetAllFilter={ () => ( {
							labelFontSize: undefined,
						} ) }
						isShownByDefault
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

						<ToggleControl
							label={ __( 'Sync fields style', 'jetpack-forms' ) }
							checked={ attributes.shareFieldAttributes }
							onChange={ value => setAttributes( { shareFieldAttributes: value } ) }
							help={ __( 'Deactivate for individual styling of this block', 'jetpack-forms' ) }
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
