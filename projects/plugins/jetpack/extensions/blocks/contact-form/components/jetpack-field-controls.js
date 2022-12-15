import {
	InspectorAdvancedControls,
	InspectorControls,
	BlockControls,
	PanelColorSettings,
} from '@wordpress/block-editor';
import {
	PanelBody,
	TextControl,
	ToggleControl,
	ToolbarGroup,
	ToolbarButton,
	Path,
} from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import renderMaterialIcon from '../../../shared/render-material-icon';
import JetpackFieldCss from './jetpack-field-css';
import JetpackFieldWidth from './jetpack-field-width';
import JetpackManageResponsesSettings from './jetpack-manage-responses-settings';

const JetpackFieldControls = ( {
	setAttributes,
	width,
	id,
	required,
	placeholder,
	attributes,
} ) => {
	return (
		<>
			<BlockControls>
				<ToolbarGroup>
					<ToolbarButton
						title={ __( 'Required', 'jetpack' ) }
						icon={ renderMaterialIcon(
							<Path
								d="M8.23118 8L16 16M8 16L15.7688 8 M6.5054 11.893L17.6567 11.9415M12.0585 17.6563L12 6.5"
								stroke="currentColor"
							/>
						) }
						onClick={ () => {
							setAttributes( { required: ! required } );
						} }
						className={ required ? 'is-pressed' : undefined }
					/>
				</ToolbarGroup>
			</BlockControls>

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
						help={ __(
							'Does this field have to be completed for the form to be submitted?',
							'jetpack'
						) }
					/>

					<TextControl
						label={ __( 'Placeholder text', 'jetpack' ) }
						value={ placeholder }
						onChange={ value => setAttributes( { placeholder: value } ) }
						help={ __(
							'Show visitors an example of the type of content expected. Otherwise, leave blank.',
							'jetpack'
						) }
					/>
					<TextControl
						label={ __( 'Corner radius', 'jetpack' ) }
						value={ attributes.borderRadius }
						onChange={ value => setAttributes( { borderRadius: parseInt( value, 10 ) || 0 } ) }
						type="number"
						style={ { marginLeft: '15px', width: '25%' } }
					/>
					<TextControl
						label={ __( 'Border width', 'jetpack' ) }
						value={ attributes.borderWidth }
						onChange={ value => setAttributes( { borderWidth: parseInt( value, 10 ) || 1 } ) }
						type="number"
						style={ { marginLeft: '15px', width: '25%' } }
					/>
					<TextControl
						label={ __( 'Line Height', 'jetpack' ) }
						value={ attributes.lineHeight }
						onChange={ value => setAttributes( { lineHeight: parseFloat( value, 10 ) || 1.5 } ) }
						type="number"
						style={ { marginLeft: '15px', width: '25%' } }
					/>

					<JetpackFieldWidth setAttributes={ setAttributes } width={ width } />
				</PanelBody>
				<PanelColorSettings
					title={ __( 'Block styling', 'jetpack' ) }
					initialOpen={ false }
					colorSettings={ [
						{
							value: attributes.textColor,
							onChange: value => setAttributes( { textColor: value } ),
							label: __( 'Text color', 'jetpack' ),
						},
						{
							value: attributes.backgroundColor,
							onChange: value => setAttributes( { backgroundColor: value } ),
							label: __( 'Background color', 'jetpack' ),
						},
						{
							value: attributes.borderColor,
							onChange: value => setAttributes( { borderColor: value } ),
							label: __( 'Border color', 'jetpack' ),
						},
					] }
				></PanelColorSettings>
			</InspectorControls>

			<InspectorAdvancedControls>
				<JetpackFieldCss setAttributes={ setAttributes } id={ id } />
			</InspectorAdvancedControls>
		</>
	);
};

export default JetpackFieldControls;
