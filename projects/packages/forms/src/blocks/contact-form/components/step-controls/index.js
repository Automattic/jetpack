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
import { useEffect } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { next, previous } from '@wordpress/icons';
import useFormSteps from '../../../../hooks/use-form-steps';
import useParentFormClientId from '../../../../hooks/useParentFormClientId';
import { store as previewStore } from '../../../../store/preview-store';

/**
 * Toolbar controls for managing steps within a multi-step form.
 *
 * @param {object}  props                - Component props.
 * @param {string}  props.formClientId   - Client ID of the root contact form block.
 * @param {string}  props.clientId       - Client ID of the current block.
 * @param {boolean} props.showToggle     - Flag to indicate if toggle buttons should be shown.
 * @param {boolean} props.showNavigation - Flag to indicate if navigation controls should be shown.
 * @return {JSX.Element} The rendered BlockControls component.
 */
export default function StepControls( {
	formClientId = null,
	clientId = null,
	showToggle = true,
	showNavigation = true,
} ) {
	const { setPreviewStep, disablePreview, enablePreview } = useDispatch( previewStore );

	const parentFormClientId = useParentFormClientId( clientId );

	// Use prop value if provided, otherwise fall back to parent form client ID
	formClientId = formClientId || parentFormClientId;

	// Get form steps using the dedicated hook
	const steps = useFormSteps( formClientId );

	const { selectedBlockClientId, selectedStepId, isPreview, currentStepInfo } = useSelect(
		select => {
			const { getSelectedBlockClientId } = select( blockEditorStore );
			const { isPreviewMode, getActivePreviewStepId, getCurrentStepInfo } = select( previewStore );

			const selectedStepClientIdForForm = getActivePreviewStepId( formClientId );

			return {
				selectedStepId: selectedStepClientIdForForm,
				isPreview: isPreviewMode( formClientId ),
				selectedBlockClientId: getSelectedBlockClientId(), // Global selection
				currentStepInfo: getCurrentStepInfo( formClientId, steps ),
			};
		},
		[ formClientId, steps ]
	);

	// Sync List View selection with step preview
	useEffect( () => {
		// Don't update if we're in "All Steps" view or if navigation is disabled.
		if ( ! isPreview || ! showNavigation ) {
			return;
		}

		// Check if the selected block is one of our steps (relevant to the current form)
		const isStepSelected = steps.some( step => step.clientId === selectedBlockClientId );

		// If a step is selected in List View but it's different from our current preview for this form, update it
		if ( isStepSelected && selectedBlockClientId !== selectedStepId ) {
			setPreviewStep( formClientId, selectedBlockClientId );
		}
	}, [
		selectedBlockClientId,
		steps,
		selectedStepId,
		setPreviewStep,
		showNavigation,
		isPreview,
		formClientId,
	] );

	// Helper function to navigate to the next step
	const navigateToNextStep = () => {
		const { index, isLastStep } = currentStepInfo;
		if ( ! isLastStep && index !== -1 ) {
			const nextStepId = steps[ index + 1 ].clientId;
			setPreviewStep( formClientId, nextStepId );
		}
	};

	// Helper function to navigate to the previous step
	const navigateToPreviousStep = () => {
		const { index, isFirstStep } = currentStepInfo;
		if ( ! isFirstStep ) {
			const prevStepId = steps[ index - 1 ].clientId;
			setPreviewStep( formClientId, prevStepId );
		}
	};

	// Don't render controls if there are no steps
	if ( ! steps || steps.length === 0 ) {
		return null;
	}

	const { stepLabel, index: currentStepIndex, isFirstStep, isLastStep } = currentStepInfo;

	// Format the display label based on whether we're in preview mode and which step is active
	let displayLabel;
	if ( ! isPreview ) {
		displayLabel = __( 'All Steps', 'jetpack-forms' );
	} else if ( currentStepIndex >= 0 ) {
		displayLabel = `${ currentStepIndex + 1 }. ${ stepLabel }`;
	} else {
		displayLabel = __( 'Select Step', 'jetpack-forms' );
	}

	return (
		<BlockControls>
			<ToolbarGroup>
				{ showToggle && (
					<>
						<ToolbarButton
							onClick={ () => disablePreview( formClientId ) }
							isPressed={ ! isPreview }
						>
							{ __( 'All Steps', 'jetpack-forms' ) }
						</ToolbarButton>
						<ToolbarButton
							onClick={ () => {
								if ( ! isPreview && steps.length > 0 ) {
									// First set the step if one isn't already selected
									if ( selectedStepId === null ) {
										setPreviewStep( formClientId, steps[ 0 ].clientId );
									}
									// Then enable preview mode
									enablePreview( formClientId );
								}
							} }
							isPressed={ isPreview }
						>
							{ __( 'Preview', 'jetpack-forms' ) }
						</ToolbarButton>{ ' ' }
					</>
				) }

				{ isPreview && showNavigation && (
					<>
						<>
							<ToolbarButton
								showTooltip={ true }
								label={ __( 'Previous Step', 'jetpack-forms' ) }
								disabled={ isFirstStep }
								onClick={ navigateToPreviousStep }
							>
								<Icon icon={ previous } />
							</ToolbarButton>
							<ToolbarButton
								showTooltip={ true }
								label={ __( 'Next Step', 'jetpack-forms' ) }
								disabled={ isLastStep }
								onClick={ navigateToNextStep }
							>
								<Icon icon={ next } />
							</ToolbarButton>
						</>
						<DropdownMenu
							icon={ null }
							label={ __( 'Select step to preview', 'jetpack-forms' ) }
							popoverProps={ { placement: 'bottom-start' } }
							toggleProps={ {
								children: (
									<>
										{ displayLabel }
										<span style={ { width: '8px' } } />
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
								as: ToolbarButton,
							} }
						>
							{ ( { onClose } ) => (
								<MenuGroup key="choose-steps" label={ __( 'Preview Steps', 'jetpack-forms' ) }>
									{ steps.map( ( step, index ) => (
										<MenuItem
											key={ step.clientId }
											onClick={ () => {
												setPreviewStep( formClientId, step.clientId );
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
					</>
				) }
			</ToolbarGroup>
		</BlockControls>
	);
}
