import { BlockControls } from '@wordpress/block-editor';
import {
	ToolbarGroup,
	ToolbarButton,
	Icon,
	MenuGroup,
	MenuItem,
	ToolbarDropdownMenu,
	SVG,
	Path,
} from '@wordpress/components';
import { useDispatch, useSelect } from '@wordpress/data';
import { __ } from '@wordpress/i18n';
import { next, previous } from '@wordpress/icons';
import useStepNavigation from '../../../../hooks/use-step-navigation';
import { store as singleStepStore } from '../../../../store/preview-store';

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
					icon={
						<SVG viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" width="20" height="20">
							<Path d="M7 10l5 5 5-5z" />
						</SVG>
					}
					text={ ! isSingleStep ? __( 'All steps', 'jetpack-forms' ) : displayLabel }
					popoverProps={ { placement: 'bottom-start' } }
					toggleProps={ {
						showTooltip: true,
						children: ! isSingleStep ? __( 'All steps', 'jetpack-forms' ) : displayLabel,
					} }
				>
					{ ( { onClose } ) => (
						<MenuGroup key="choose-steps" label={ __( 'Available Steps', 'jetpack-forms' ) }>
							<MenuItem
								onClick={ () => {
									if ( isSingleStep ) {
										disableSingleStepMode( formClientId );
									}
									onClose();
								} }
								isSelected={ ! isSingleStep }
								icon={ ! isSingleStep ? 'yes' : null }
							>
								{ __( 'All steps', 'jetpack-forms' ) }
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
									icon={ selectedStepId === step.clientId && isSingleStep ? 'yes' : null }
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
