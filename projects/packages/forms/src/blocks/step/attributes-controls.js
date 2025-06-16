import { InspectorControls, store as blockEditorStore } from '@wordpress/block-editor';
import { PanelBody, TextControl } from '@wordpress/components';
import { useDispatch, useSelect } from '@wordpress/data';
import { __, sprintf } from '@wordpress/i18n';

const AttributesControls = ( { attributes, setAttributes, clientId } ) => {
	const { stepLabel = '' } = attributes;
	const { updateBlockAttributes } = useDispatch( 'core/block-editor' );
	const { metadata } = useSelect(
		select => {
			const { getBlockAttributes } = select( blockEditorStore );

			return {
				metadata: getBlockAttributes( clientId )?.metadata,
			};
		},
		[ clientId ]
	);

	// Handle updating the block's metadata when stepLabel changes
	const handleStepLabelChange = value => {
		setAttributes( { stepLabel: value } );
		updateBlockAttributes( [ clientId ], {
			metadata: {
				...metadata,
				name:
					value === ''
						? __( 'Step', 'jetpack-forms' )
						: sprintf(
								/* translators: %s: Step label */
								__( 'Step: %s', 'jetpack-forms' ),
								value
						  ),
			},
		} );
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
