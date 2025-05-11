import { BlockControls, store as blockEditorStore } from '@wordpress/block-editor';
import {
	ToolbarGroup,
	DropdownMenu,
	ToolbarButton,
	Icon,
	SVG,
	Path,
	MenuGroup,
	MenuItem,
} from '@wordpress/components';
import { useDispatch, useSelect } from '@wordpress/data';
import { useCallback, useEffect } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { next, previous } from '@wordpress/icons';
import { store as previewStore } from '../../../../store/preview-store';

/**
 * Toolbar controls for managing steps within a multi-step form.
 *
 * @param {object}  props              - Component props.
 * @param {string}  props.formClientId - Client ID of the root contact form block.
 * @param {boolean} props.onlyNav      - Flag to indicate if only navigation buttons should be shown.
 * @param {boolean} props.isStep       - Flag to indicate if the current block is a step (controls are for a step).
 * @return {JSX.Element} The rendered BlockControls component.
 */
export default function StepControls( { formClientId, onlyNav = false, isStep = false } ) {
	const { setActivePreviewStepId, showAllSteps } = useDispatch( previewStore );

	const { steps, isFirstStep, isLastStep, selectedBlockClientId, selectedStepId, isPreview } =
		useSelect(
			select => {
				const { getBlocks, getSelectedBlockClientId } = select( blockEditorStore );
				const { isPreviewMode, getActivePreviewStepId } = select( previewStore );

				const currentFormId = formClientId;

				const selectedStepClientIdForForm = getActivePreviewStepId( currentFormId );
				const innerBlocks = getBlocks( currentFormId );

				let stepBlocks = innerBlocks.filter( block => block.name === 'jetpack/form-step' );

				if ( stepBlocks.length === 0 ) {
					const stepContainer = innerBlocks.find(
						block => block.name === 'jetpack/step-container'
					);
					stepBlocks = stepContainer ? getBlocks( stepContainer.clientId ) : [];
				}

				return {
					steps: stepBlocks,
					selectedStepId: selectedStepClientIdForForm,
					isPreview: isPreviewMode( currentFormId ),
					isFirstStep: stepBlocks[ 0 ]?.clientId === selectedStepClientIdForForm,
					isLastStep: stepBlocks[ stepBlocks.length - 1 ]?.clientId === selectedStepClientIdForForm,
					selectedBlockClientId: getSelectedBlockClientId(), // Global selection
				};
			},
			[ formClientId ]
		);

	// Handle step selection change - directly update the parent attribute.
	const handleStepChange = useCallback(
		newStepClientId => {
			setActivePreviewStepId( formClientId, newStepClientId );
		},
		[ setActivePreviewStepId, formClientId ]
	);

	// Sync List View selection with step preview
	useEffect( () => {
		// Don't update if we're in "All Steps" view or if these controls are part of a step itself.
		if ( ! isPreview || isStep ) {
			return;
		}

		// Check if the selected block is one of our steps (relevant to the current form)
		const isStepSelected = steps.some( step => step.clientId === selectedBlockClientId );

		// If a step is selected in List View but it's different from our current preview for this form, update it
		if ( isStepSelected && selectedBlockClientId !== selectedStepId ) {
			handleStepChange( selectedBlockClientId );
		}
	}, [
		selectedBlockClientId,
		steps,
		selectedStepId,
		handleStepChange,
		isStep,
		isPreview,
		formClientId,
	] ); // Added formClientId

	// Effect to validate selectedStepId when steps change (e.g., a step is deleted)
	useEffect( () => {
		if ( ! steps || steps.length === 0 ) {
			// If we have no steps, and a step selection still exists for this form, clear it.
			if ( isPreview ) {
				showAllSteps( formClientId );
			}
			return;
		}

		const isTrulyInvalidSelection =
			selectedStepId !== null && ! steps.some( step => step.clientId === selectedStepId );

		if ( isTrulyInvalidSelection ) {
			setActivePreviewStepId( formClientId, steps[ 0 ].clientId );
		}
	}, [ steps, selectedStepId, setActivePreviewStepId, showAllSteps, isPreview, formClientId ] ); // Added formClientId and showAllSteps

	// Determine the current step label and index
	const getCurrentStepInfo = useCallback( () => {
		if ( selectedStepId === null ) {
			return { label: __( 'All Steps', 'jetpack-forms' ), index: -1 };
		}

		const currentStepIndex = steps.findIndex( step => step.clientId === selectedStepId );
		if ( currentStepIndex >= 0 ) {
			const currentStepLabel = steps[ currentStepIndex ]?.attributes?.stepLabel || '';
			return {
				label: `${ currentStepIndex + 1 }. ${ currentStepLabel }`,
				index: currentStepIndex,
			};
		}

		return { label: __( 'Select Step', 'jetpack-forms' ), index: -1 };
	}, [ selectedStepId, steps ] );

	// Don't render controls if there are no steps
	if ( ! steps || steps.length === 0 ) {
		return null;
	}

	const { label: currentStepLabel, index: currentStepIndex } = getCurrentStepInfo();

	return (
		<BlockControls>
			<ToolbarGroup>
				{ ! onlyNav && (
					<>
						<ToolbarButton
							onClick={ () => showAllSteps( formClientId ) }
							isPressed={ selectedStepId === null }
						>
							{ __( 'All Steps', 'jetpack-forms' ) }
						</ToolbarButton>
						<ToolbarButton
							onClick={ () => {
								if ( selectedStepId === null && steps.length > 0 ) {
									handleStepChange( steps[ 0 ].clientId );
								}
							} }
							isPressed={ selectedStepId !== null }
						>
							{ __( 'Preview', 'jetpack-forms' ) }
						</ToolbarButton>{ ' ' }
					</>
				) }

				{ /* Navigation buttons - only shown in Preview mode */ }
				{ isPreview && (
					<>
						<ToolbarButton
							showTooltip={ true }
							label={ __( 'Previous Step', 'jetpack-forms' ) }
							disabled={ isFirstStep }
							onClick={ () => {
								if ( currentStepIndex > 0 ) {
									handleStepChange( steps[ currentStepIndex - 1 ].clientId );
								}
							} }
						>
							<Icon icon={ previous } />
						</ToolbarButton>
						<ToolbarButton
							showTooltip={ true }
							label={ __( 'Next Step', 'jetpack-forms' ) }
							disabled={ isLastStep }
							onClick={ () => {
								const stepIndex = steps.findIndex( step => step.clientId === selectedStepId );
								if ( stepIndex !== -1 && stepIndex < steps.length - 1 ) {
									const nextStepId = steps[ stepIndex + 1 ].clientId;
									handleStepChange( nextStepId );
								}
							} }
						>
							<Icon icon={ next } />
						</ToolbarButton>
					</>
				) }

				{ isPreview && (
					<DropdownMenu
						icon={ null }
						label={ __( 'Select step to preview', 'jetpack-forms' ) }
						popoverProps={ { placement: 'bottom-start' } }
						toggleProps={ {
							children: (
								<>
									{ currentStepLabel }
									<span style={ { width: '8px' } } /> { /* Spacer */ }
									<SVG
										xmlns="http://www.w3.org/2000/svg"
										width="12"
										height="12"
										viewBox="0 0 24 24"
										fill="currentColor"
									>
										<Path d="M17.5 11.6L12 16l-5.5-4.4.9-1.2L12 14l4.5-3.6 1 1.2z"></Path>
									</SVG>
								</>
							),
							showTooltip: false,
							as: ToolbarButton, // Render toggle as ToolbarButton
						} }
					>
						{ ( { onClose } ) => (
							<MenuGroup key="choose-steps" label={ __( 'Preview Steps', 'jetpack-forms' ) }>
								{ steps.map( ( step, index ) => (
									<MenuItem
										key={ step.clientId }
										onClick={ () => {
											handleStepChange( step.clientId );
											onClose();
										} }
										isSelected={ selectedStepId === step.clientId }
										icon={ selectedStepId === step.clientId ? 'yes' : null }
									>
										{ `${ index + 1 }. ${ step?.attributes?.stepLabel }` }
									</MenuItem>
								) ) }
							</MenuGroup>
						) }
					</DropdownMenu>
				) }
			</ToolbarGroup>
		</BlockControls>
	);
}
