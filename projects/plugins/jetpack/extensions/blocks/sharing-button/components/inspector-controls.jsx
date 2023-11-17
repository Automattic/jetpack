import { InspectorControls } from '@wordpress/block-editor';
import { PanelBody, PanelRow, TextControl } from '@wordpress/components';
import { __, sprintf } from '@wordpress/i18n';

const SharingButtonInspectorControls = ( { attributes, setAttributes, socialLinkName } ) => {
	const { label, rel } = attributes;
	return (
		<>
			<InspectorControls>
				<PanelBody
					title={ sprintf(
						/* translators: %s: name of the social service. */
						__( '%s label', 'jetpack' ),
						socialLinkName
					) }
					initialOpen={ false }
				>
					<PanelRow>
						<TextControl
							__nextHasNoMarginBottom
							label={ __( 'Link label', 'jetpack' ) }
							help={ __( 'Briefly describe the link to help screen reader users.', 'jetpack' ) }
							value={ label || '' }
							onChange={ value => setAttributes( { label: value } ) }
						/>
					</PanelRow>
				</PanelBody>
			</InspectorControls>
			<InspectorControls group="advanced">
				<TextControl
					__nextHasNoMarginBottom
					label={ __( 'Link rel', 'jetpack' ) }
					value={ rel || '' }
					onChange={ value => setAttributes( { rel: value } ) }
				/>
			</InspectorControls>
		</>
	);
};

export default SharingButtonInspectorControls;
