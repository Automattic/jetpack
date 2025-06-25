import { BlockControls, store as blockEditorStore } from '@wordpress/block-editor';
import { createBlock } from '@wordpress/blocks';
import { ToolbarGroup, MenuGroup, MenuItem, ToolbarDropdownMenu } from '@wordpress/components';
import { useDispatch, useSelect } from '@wordpress/data';
import { useCallback } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { store as singleStepStore } from '../../../../store/form-step-preview';
import useFormSteps from '../../hooks/use-form-steps';
import useStepContainerClientId from '../../hooks/use-step-container-client-id';

/**
 * Toolbar controls for managing steps within a multi-step form.
 *
 * @param {object} props              - Component props.
 * @param {string} props.formClientId - Client ID of the root contact form block.
 * @param {string} props.clientId     - Client ID of the current block.
 * @return {JSX.Element} The rendered BlockControls component.
 */
export default function AddStepControls( { clientId, formClientId } ) {
	const { setActiveStep } = useDispatch( singleStepStore );

	const { insertBlock } = useDispatch( blockEditorStore );

	const containerId = useStepContainerClientId( formClientId );
	const steps = useFormSteps( formClientId );
	const { isSingleStep } = useSelect(
		select => {
			const { isSingleStepMode } = select( singleStepStore );
			return {
				isSingleStep: isSingleStepMode( formClientId ),
			};
		},
		[ formClientId ]
	);

	// Custom function to insert a step container block after a specific block
	const insertStepAtIndex = useCallback(
		( targetId, index, formId, isSingleStepMode ) => {
			// Create a new step container block with default attributes
			const newStepBlock = createBlock( 'jetpack/form-step' );
			insertBlock( newStepBlock, index, targetId );

			// Set this as the active step if in single step mode
			if ( isSingleStepMode ) {
				setTimeout( () => {
					setActiveStep( formId, newStepBlock.clientId );
				}, 10 );
			}
		},
		[ insertBlock, setActiveStep ]
	);

	// Don't render controls if there are no steps
	if ( ! steps || steps.length === 0 ) {
		return null;
	}

	const currentStepIndex = steps.findIndex( step => step.clientId === clientId );

	return (
		<BlockControls>
			<ToolbarGroup>
				<ToolbarDropdownMenu
					icon={ null }
					text={ __( 'Add', 'jetpack-forms' ) }
					popoverProps={ { placement: 'bottom-start' } }
					toggleProps={ {
						showTooltip: true,
						children: __( 'Add step', 'jetpack-forms' ),
					} }
				>
					{ ( { onClose } ) => (
						<MenuGroup>
							{ currentStepIndex !== -1 && (
								<MenuItem
									onClick={ () => {
										insertStepAtIndex( containerId, currentStepIndex, formClientId, isSingleStep );
										onClose();
									} }
								>
									{ __( 'Add step before', 'jetpack-forms' ) }
								</MenuItem>
							) }
							{ currentStepIndex !== -1 && (
								<MenuItem
									onClick={ () => {
										insertStepAtIndex(
											containerId,
											currentStepIndex + 1,
											formClientId,
											isSingleStep
										);
										onClose();
									} }
								>
									{ __( 'Add step after', 'jetpack-forms' ) }
								</MenuItem>
							) }
							{ currentStepIndex === -1 && (
								<MenuItem
									onClick={ () => {
										insertStepAtIndex( containerId, 0, formClientId, isSingleStep );
										onClose();
									} }
								>
									{ __( 'Add at the beginning', 'jetpack-forms' ) }
								</MenuItem>
							) }
							{ currentStepIndex === -1 && (
								<MenuItem
									onClick={ () => {
										insertStepAtIndex( containerId, steps.length, formClientId, isSingleStep );
										onClose();
									} }
								>
									{ __( 'Add at the end', 'jetpack-forms' ) }
								</MenuItem>
							) }
						</MenuGroup>
					) }
				</ToolbarDropdownMenu>
			</ToolbarGroup>
		</BlockControls>
	);
}
