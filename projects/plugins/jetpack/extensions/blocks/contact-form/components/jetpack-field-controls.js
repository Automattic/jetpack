import {
	FontSizePicker,
	InspectorAdvancedControls,
	InspectorControls,
	LineHeightControl,
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
	attributes,
	id,
	placeholder,
	required,
	setAttributes,
	width,
	disableStyleControls,
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
						help={ __( 'You can edit the "required" label in the editor', 'jetpack' ) }
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

					<JetpackFieldWidth setAttributes={ setAttributes } width={ width } />
				</PanelBody>

				{ ! disableStyleControls && (
					<>
						<PanelColorSettings
							title={ __( 'Color', 'jetpack' ) }
							initialOpen={ false }
							colorSettings={ [
								{
									value: attributes.labelColor,
									onChange: value => setAttributes( { labelColor: value } ),
									label: __( 'Label text', 'jetpack' ),
								},
								{
									value: attributes.inputColor,
									onChange: value => setAttributes( { inputColor: value } ),
									label: __( 'Field text', 'jetpack' ),
								},
								{
									value: attributes.fieldBackgroundColor,
									onChange: value => setAttributes( { fieldBackgroundColor: value } ),
									label: __( 'Field Background', 'jetpack' ),
								},
								{
									value: attributes.borderColor,
									onChange: value => setAttributes( { borderColor: value } ),
									label: __( 'Field Border', 'jetpack' ),
								},
								{
									value: attributes.blockBackgroundColor,
									onChange: value => setAttributes( { blockBackgroundColor: value } ),
									label: __( 'Block Background', 'jetpack' ),
								},
							] }
						></PanelColorSettings>
						<PanelBody
							title={ __( 'Typography', 'jetpack' ) }
							initialOpen={
								attributes.labelFontSize || attributes.fieldFontSize || attributes.lineHeight
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
							<FontSizePicker
								withSlider
								withReset={ true }
								size="__unstable-large"
								__nextHasNoMarginBottom
								onChange={ fieldFontSize => setAttributes( { fieldFontSize } ) }
								value={ attributes.fieldFontSize }
							/>
							<LineHeightControl
								__unstableInputWidth="100%"
								__nextHasNoMarginBottom={ true }
								value={ attributes.lineHeight }
								onChange={ lineHeight =>
									setAttributes( { lineHeight: parseFloat( lineHeight, 10 ) || 1.5 } )
								}
								size="__unstable-large"
							/>
						</PanelBody>
						<PanelBody
							title={ __( 'Border', 'jetpack' ) }
							initialOpen={ attributes.borderWidth || attributes.borderRadius }
						>
							<TextControl
								label={ __( 'Width', 'jetpack' ) }
								value={ attributes.borderWidth }
								onChange={ borderWidth =>
									setAttributes( { borderWidth: parseInt( borderWidth, 10 ) } )
								}
							/>
							<TextControl
								label={ __( 'Radius', 'jetpack' ) }
								value={ attributes.borderRadius }
								onChange={ borderRadius =>
									setAttributes( { borderRadius: parseInt( borderRadius, 10 ) } )
								}
							/>
						</PanelBody>
					</>
				) }
			</InspectorControls>

			<InspectorAdvancedControls>
				<JetpackFieldCss setAttributes={ setAttributes } id={ id } />
			</InspectorAdvancedControls>
		</>
	);
};

export default JetpackFieldControls;
