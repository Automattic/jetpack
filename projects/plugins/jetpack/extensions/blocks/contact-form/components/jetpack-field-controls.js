/**
 * External dependencies
 */
import { __ } from '@wordpress/i18n';
import {
	InspectorAdvancedControls,
	InspectorControls,
	BlockControls,
} from '@wordpress/block-editor';
import { PanelBody, ToggleControl, Toolbar, ToolbarButton, Path } from '@wordpress/components';

/**
 * Internal Dependencies
 */
import renderMaterialIcon from '../../../shared/render-material-icon';
import JetpackFieldWidth from './jetpack-field-width';
import JetpackFieldCss from './jetpack-field-css';

const JetpackFieldControls = ( { setAttributes, width, id, required } ) => {
	return (
		<>
			<BlockControls>
				<Toolbar>
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
				</Toolbar>
			</BlockControls>

			<InspectorControls>
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

					<JetpackFieldWidth setAttributes={ setAttributes } width={ width } />
				</PanelBody>
			</InspectorControls>

			<InspectorAdvancedControls>
				<JetpackFieldCss setAttributes={ setAttributes } id={ id } />
			</InspectorAdvancedControls>
		</>
	);
};

export default JetpackFieldControls;
