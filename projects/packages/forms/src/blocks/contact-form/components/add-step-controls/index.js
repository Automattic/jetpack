import { BlockControls, store as blockEditorStore } from '@wordpress/block-editor';
import { createBlock } from '@wordpress/blocks';
import { ToolbarGroup, DropdownMenu, MenuGroup, MenuItem } from '@wordpress/components';
import { useDispatch, useSelect } from '@wordpress/data';
import { useCallback } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import useFormSteps from '../../../../hooks/use-form-steps';
import { store as previewStore } from '../../../../store/preview-store';

/**
 * Toolbar controls for managing steps within a multi-step form.
 *
 * @param {object}  props                    - Component props.
 * @param {string}  props.formClientId       - Client ID of the root contact form block.
 * @param {string}  props.clientId           - Client ID of the current block.
 * @param {boolean} props.showToggle         - Flag to indicate if toggle buttons should be shown.
 * @param {boolean} props.showNavigation     - Flag to indicate if navigation controls should be shown.
 * @param {boolean} props.updateStepSelected - Flag to indicate if the step should be selected.
 * @return {JSX.Element} The rendered BlockControls component.
 */
export default function AddStepControls( { clientId, formClientId } ) {
	const { setPreviewStep } = useDispatch( previewStore );

	const { insertBlock } = useDispatch( blockEditorStore );

	const { steps, containerId } = useFormSteps( formClientId );
	const { isPreview } = useSelect(
		select => {
			const { isPreviewMode } = select( previewStore );
			return {
				isPreview: isPreviewMode( formClientId ),
			};
		},
		[ formClientId ]
	);

	// Custom function to insert a step container block after a specific block
	const insertStepAtIndex = useCallback(
		( targetId, index, formId, isPreviewMode ) => {
			// Create a new step container block with default attributes
			const newStepBlock = createBlock( 'jetpack/form-step' );
			insertBlock( newStepBlock, index, targetId );

			// Set this as the preview step if in preview mode
			if ( isPreviewMode ) {
				setPreviewStep( formId, newStepBlock.clientId );
			}
		},
		[ insertBlock, setPreviewStep ]
	);

	// Don't render controls if there are no steps
	if ( ! steps || steps.length === 0 ) {
		return null;
	}

	const currentStepIndex = steps.findIndex( step => step.clientId === clientId );

	return (
		<BlockControls>
			<ToolbarGroup>
				<DropdownMenu
					icon={ null }
					label={ __( 'Add', 'jetpack-forms' ) }
					popoverProps={ { placement: 'bottom-start' } }
					toggleProps={ {
						showTooltip: true,
						children: __( 'Add Step', 'jetpack-forms' ),
					} }
				>
					{ ( { onClose } ) => (
						<MenuGroup key="add-step-options">
							{ currentStepIndex !== -1 && (
								<MenuItem
									onClick={ () => {
										insertStepAtIndex( containerId, currentStepIndex, formClientId, isPreview );
										onClose();
									} }
								>
									{ __( 'Add Before Current Step', 'jetpack-forms' ) }
								</MenuItem>
							) }
							{ currentStepIndex !== -1 && (
								<MenuItem
									onClick={ () => {
										insertStepAtIndex( containerId, currentStepIndex + 1, formClientId, isPreview );
										onClose();
									} }
								>
									{ __( 'Add After Current Step', 'jetpack-forms' ) }
								</MenuItem>
							) }
							<MenuItem
								onClick={ () => {
									insertStepAtIndex( containerId, 0, formClientId, isPreview );
									onClose();
								} }
							>
								{ __( 'Add To Start', 'jetpack-forms' ) }
							</MenuItem>
							<MenuItem
								onClick={ () => {
									insertStepAtIndex( containerId, steps.length, formClientId, isPreview );
									onClose();
								} }
							>
								{ __( 'Add To End', 'jetpack-forms' ) }
							</MenuItem>
						</MenuGroup>
					) }
				</DropdownMenu>
			</ToolbarGroup>
		</BlockControls>
	);
}
