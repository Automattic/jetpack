import { BlockControls } from '@wordpress/block-editor';
import {
	ToolbarGroup,
	ToolbarButton,
	Icon,
	MenuGroup,
	MenuItem,
	ToolbarDropdownMenu,
} from '@wordpress/components';
import { useDispatch, useSelect } from '@wordpress/data';
import { __ } from '@wordpress/i18n';
import { next, previous, check } from '@wordpress/icons';
import useStepNavigation from '../../../../hooks/use-step-navigation';
import { store as singleStepStore } from '../../../../store/preview-store';
import StepContainerIcon from '../icons/StepContainerIcon';
import StepIcon from '../icons/StepIcon';

/**
 * Toolbar controls for managing steps within a multi-step form.
 *
 * @param {object}  props                    - Component props.
 * @param {string}  props.formClientId       - Client ID of the root contact form block.
 * @param {boolean} props.updateStepSelected - Whether to update the selected step.
 * @return {JSX.Element} The rendered BlockControls component.
 */
export default function StepControls( { formClientId, updateStepSelected = false } ) {
	const { setActiveStep, enableSingleStepMode, disableSingleStepMode } =
		useDispatch( singleStepStore );

	// Use our custom navigation hook
	const { navigateToNextStep, navigateToPreviousStep, currentStepInfo, steps } = useStepNavigation(
		formClientId,
		updateStepSelected
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
					toggleProps={ {
						showTooltip: true,
						label: __( 'Edit mode', 'jetpack-forms' ),
					} }
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
										onClose();
									} }
									isSelected={ selectedStepId === step.clientId && isSingleStep }
									suffix={
										selectedStepId === step.clientId && isSingleStep ? (
											<Icon icon={ check } />
										) : null
									}
								>
									{ `${ index + 1 }. ${ step?.attributes?.stepLabel }` }
								</MenuItem>
							) ) }
						</MenuGroup>
					) }
				</ToolbarDropdownMenu>
				<ToolbarButton
					showTooltip={ true }
					label={ __( 'Previous step', 'jetpack-forms' ) }
					disabled={ ! isSingleStep || isFirstStep }
					onClick={ navigateToPreviousStep }
				>
					<Icon icon={ previous } />
				</ToolbarButton>
				<ToolbarButton
					showTooltip={ true }
					label={ __( 'Next step', 'jetpack-forms' ) }
					disabled={ ! isSingleStep || isLastStep }
					onClick={ navigateToNextStep }
				>
					<Icon icon={ next } />
				</ToolbarButton>
			</ToolbarGroup>
		</BlockControls>
	);
}
