import { BlockControls, store as blockEditorStore } from '@wordpress/block-editor';
import {
	ToolbarGroup,
	ToolbarButton,
	Icon,
	MenuGroup,
	MenuItem,
	ToolbarDropdownMenu,
} from '@wordpress/components';
import { useDispatch, useSelect } from '@wordpress/data';
import { __, sprintf } from '@wordpress/i18n';
import { next, previous, check } from '@wordpress/icons';
import { store as singleStepStore } from '../../../../store/form-step-preview';
import StepIcon from '../../../form-step/icon';
import StepContainerIcon from '../../../form-step-container/icon';
import useStepNavigation from '../../hooks/use-step-navigation';

/**
 * Toolbar controls for managing steps within a multi-step form.
 *
 * @param {object} props              - Component props.
 * @param {string} props.formClientId - Client ID of the root contact form block.
 * @return {JSX.Element} The rendered BlockControls component.
 */
export default function StepControls( { formClientId } ) {
	const { setActiveStep, enableSingleStepMode, disableSingleStepMode } =
		useDispatch( singleStepStore );

	// Access the block editor dispatcher to programmatically select blocks when needed.
	const { selectBlock } = useDispatch( blockEditorStore );

	// Use our custom navigation hook
	const { navigateToNextStep, navigateToPreviousStep, currentStepInfo, steps } = useStepNavigation(
		formClientId,
		true // always update the selected block when navigating
	);

	const { selectedStepId, isSingleStep } = useSelect(
		select => {
			const { isSingleStepMode, getActiveStepId } = select( singleStepStore );
			const selectedStepClientIdForForm = getActiveStepId( formClientId );

			return {
				selectedStepId: selectedStepClientIdForForm,
				isSingleStep: isSingleStepMode( formClientId ),
			};
		},
		[ formClientId ]
	);

	// Don't render controls if there are no steps
	if ( ! steps || steps.length === 0 ) {
		return null;
	}

	const { index: currentStepIndex, isFirstStep, isLastStep } = currentStepInfo;
	const stepNavigationInfo = __(
		'Step navigation is only available in single step mode',
		'jetpack-forms'
	);

	// Format the display label
	let displayLabel;
	if ( ! isSingleStep ) {
		displayLabel = __( 'All steps', 'jetpack-forms' );
	} else if ( currentStepIndex >= 0 ) {
		displayLabel = `${ currentStepIndex + 1 }`;
	} else {
		displayLabel = __( 'Select step', 'jetpack-forms' );
	}

	return (
		<BlockControls>
			<ToolbarGroup>
				<ToolbarDropdownMenu
					icon={ ! isSingleStep ? <StepContainerIcon /> : <StepIcon /> }
					text={ ! isSingleStep ? __( 'All steps', 'jetpack-forms' ) : displayLabel }
					label={
						isSingleStep
							? /* translators: %d: step number */
							  __( 'Currently editing step %d', 'jetpack-forms' ).replace(
									'%d',
									currentStepIndex + 1
							  )
							: __( 'Currently editing all steps', 'jetpack-forms' )
					}
					showTooltip
				>
					{ ( { onClose } ) => (
						<MenuGroup key="choose-steps" label={ __( 'Edit mode', 'jetpack-forms' ) }>
							<MenuItem
								onClick={ () => {
									if ( isSingleStep ) {
										disableSingleStepMode( formClientId );
									}
									onClose();
								} }
								isSelected={ ! isSingleStep }
								icon={ <StepContainerIcon /> }
								suffix={ ! isSingleStep ? <Icon icon={ check } /> : null }
							>
								{ __( 'All steps', 'jetpack-forms' ) }
							</MenuItem>
							<hr />
							<MenuItem disabled icon={ <StepIcon /> }>
								{ __( 'Single step', 'jetpack-forms' ) }
							</MenuItem>
							{ steps.map( ( step, index ) => (
								<MenuItem
									key={ step.clientId }
									onClick={ () => {
										setActiveStep( formClientId, step.clientId );
										enableSingleStepMode( formClientId );
										selectBlock( step.clientId );
										onClose();
									} }
									isSelected={ selectedStepId === step.clientId && isSingleStep }
									suffix={
										selectedStepId === step.clientId && isSingleStep ? (
											<Icon icon={ check } />
										) : null
									}
								>
									{ sprintf(
										/* translators: %1$d is the step number (1, 2, 3, etc.), %2$s is the step label. */
										__( '%1$d – %2$s', 'jetpack-forms' ),
										index + 1,
										step?.attributes?.stepLabel || __( 'Unlabeled', 'jetpack-forms' )
									) }
								</MenuItem>
							) ) }
						</MenuGroup>
					) }
				</ToolbarDropdownMenu>
				<ToolbarButton
					showTooltip={ true }
					label={ ! isSingleStep ? stepNavigationInfo : __( 'Previous step', 'jetpack-forms' ) }
					disabled={ ! isSingleStep || isFirstStep }
					onClick={ navigateToPreviousStep }
				>
					<Icon icon={ previous } />
				</ToolbarButton>
				<ToolbarButton
					showTooltip={ true }
					label={ ! isSingleStep ? stepNavigationInfo : __( 'Next step', 'jetpack-forms' ) }
					disabled={ ! isSingleStep || isLastStep }
					onClick={ navigateToNextStep }
				>
					<Icon icon={ next } />
				</ToolbarButton>
			</ToolbarGroup>
		</BlockControls>
	);
}
