import { InspectorControls } from '@wordpress/block-editor';
import { PanelBody, TextControl } from '@wordpress/components';
import { __ } from '@wordpress/i18n';

const AttributesControls = ( { attributes, setAttributes } ) => {
	const { stepLabel = '' } = attributes;
	// No need to fetch or update metadata here; StepBreak handles that centrally.

	// Handle updating the block's metadata when stepLabel changes
	const handleStepLabelChange = value => {
		// Centralised logic in StepBreak will handle metadata and List View updates.
		setAttributes( { stepLabel: value } );
	};

	return (
		<InspectorControls>
			<PanelBody title={ __( 'Settings', 'jetpack-forms' ) } initialOpen={ true }>
				<TextControl
					label={ __( 'Step label', 'jetpack-forms' ) }
					value={ stepLabel }
					onChange={ handleStepLabelChange }
					help={ __( 'Name the step.', 'jetpack-forms' ) }
					__next40pxDefaultSize={ true }
					__nextHasNoMarginBottom={ true }
				/>
			</PanelBody>
		</InspectorControls>
	);
};

export default AttributesControls;
