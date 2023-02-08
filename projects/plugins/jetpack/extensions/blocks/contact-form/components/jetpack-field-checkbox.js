import {
	FontSizePicker,
	InspectorAdvancedControls,
	InspectorControls,
	PanelColorSettings,
} from '@wordpress/block-editor';
import { PanelBody, ToggleControl } from '@wordpress/components';
import { withInstanceId } from '@wordpress/compose';
import { __ } from '@wordpress/i18n';
import JetpackFieldCss from './jetpack-field-css';
import JetpackFieldLabel from './jetpack-field-label';
import JetpackFieldWidth from './jetpack-field-width';
import JetpackManageResponsesSettings from './jetpack-manage-responses-settings';
import { useJetpackFieldStyles } from './use-jetpack-field-styles';

function JetpackFieldCheckbox( props ) {
	const {
		id,
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

	return (
		<div
			id={ `jetpack-field-checkbox-${ instanceId }` }
			className="jetpack-field jetpack-field-checkbox"
			style={ blockStyle }
		>
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
				<PanelBody title={ __( 'Checkbox Settings', 'jetpack' ) }>
					<ToggleControl
						label={ __( 'Checked by default', 'jetpack' ) }
						checked={ defaultValue }
						onChange={ value => setAttributes( { defaultValue: value ? 'true' : '' } ) }
					/>
				</PanelBody>
			</InspectorControls>
			<InspectorControls>
				<PanelBody title={ __( 'Manage Responses', 'jetpack' ) }>
					<JetpackManageResponsesSettings isChildBlock />
				</PanelBody>
				<PanelBody title={ __( 'Field Settings', 'jetpack' ) }>
					<ToggleControl
						label={ __( 'Field is required', 'jetpack' ) }
						className="jetpack-field-label__required"
						checked={ required }
						onChange={ value => setAttributes( { required: value } ) }
						help={ __( 'You can edit the "required" label in the editor', 'jetpack' ) }
					/>
					<JetpackFieldWidth setAttributes={ setAttributes } width={ width } />
				</PanelBody>

				<PanelColorSettings
					title={ __( 'Color', 'jetpack' ) }
					initialOpen={ false }
					colorSettings={ [
						{
							value: attributes.labelColor,
							onChange: value => setAttributes( { labelColor: value } ),
							label: __( 'Label Text', 'jetpack' ),
						},
					] }
				></PanelColorSettings>
				<PanelBody
					title={ __( 'Label Styles', 'jetpack' ) }
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

			<InspectorAdvancedControls>
				<JetpackFieldCss setAttributes={ setAttributes } id={ id } />
			</InspectorAdvancedControls>
		</div>
	);
}

export default withInstanceId( JetpackFieldCheckbox );
