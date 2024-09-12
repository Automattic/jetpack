import {
	FontSizePicker,
	InspectorControls,
	PanelColorSettings,
	BlockControls,
	useBlockProps,
} from '@wordpress/block-editor';
import { PanelBody, ToggleControl } from '@wordpress/components';
import { compose, withInstanceId } from '@wordpress/compose';
import { __ } from '@wordpress/i18n';
import { withSharedFieldAttributes } from '../util/with-shared-field-attributes';
import ToolbarRequiredGroup from './block-controls/toolbar-required-group';
import JetpackFieldLabel from './jetpack-field-label';
import JetpackFieldWidth from './jetpack-field-width';
import JetpackManageResponsesSettings from './jetpack-manage-responses-settings';
import { useJetpackFieldStyles } from './use-jetpack-field-styles';

function JetpackFieldCheckbox( props ) {
	const {
		instanceId,
		required,
		requiredText,
		label,
		setAttributes,
		width,
		defaultValue,
		attributes,
	} = props;

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
				/>
				<InspectorControls>
					<PanelBody title={ __( 'Checkbox Settings', 'jetpack-forms' ) }>
						<ToggleControl
							label={ __( 'Checked by default', 'jetpack-forms' ) }
							checked={ defaultValue }
							onChange={ value => setAttributes( { defaultValue: value ? 'true' : '' } ) }
						/>
					</PanelBody>
				</InspectorControls>
				<InspectorControls>
					<PanelBody title={ __( 'Manage Responses', 'jetpack-forms' ) }>
						<JetpackManageResponsesSettings isChildBlock />
					</PanelBody>
					<PanelBody title={ __( 'Field Settings', 'jetpack-forms' ) }>
						<ToggleControl
							label={ __( 'Field is required', 'jetpack-forms' ) }
							className="jetpack-field-label__required"
							checked={ required }
							onChange={ value => setAttributes( { required: value } ) }
							help={ __( 'You can edit the "required" label in the editor', 'jetpack-forms' ) }
						/>
						<JetpackFieldWidth setAttributes={ setAttributes } width={ width } />

						<ToggleControl
							label={ __( 'Sync fields style', 'jetpack-forms' ) }
							checked={ attributes.shareFieldAttributes }
							onChange={ value => setAttributes( { shareFieldAttributes: value } ) }
							help={ __( 'Deactivate for individual styling of this block', 'jetpack-forms' ) }
						/>
					</PanelBody>
					<PanelColorSettings
						title={ __( 'Color', 'jetpack-forms' ) }
						initialOpen={ false }
						colorSettings={ [
							{
								value: attributes.labelColor,
								onChange: value => setAttributes( { labelColor: value } ),
								label: __( 'Label Text', 'jetpack-forms' ),
							},
						] }
					/>
					<PanelBody
						title={ __( 'Label Styles', 'jetpack-forms' ) }
						initialOpen={ attributes.labelFontSize }
					>
						<FontSizePicker
							withSlider
							withReset={ true }
							size="__unstable-large"
							__nextHasNoMarginBottom
							onChange={ labelFontSize => setAttributes( { labelFontSize } ) }
							value={ attributes.labelFontSize }
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
