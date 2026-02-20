import { BlockControls } from '@wordpress/block-editor';
import {
	ToolbarGroup,
	ToolbarButton,
	Icon,
	MenuGroup,
	MenuItem,
	ToolbarDropdownMenu,
	// eslint-disable-next-line @wordpress/no-unsafe-wp-apis
	__experimentalTruncate as Truncate,
} from '@wordpress/components';
import { useDispatch, useSelect } from '@wordpress/data';
import { __ } from '@wordpress/i18n';
import { next, previous, check } from '@wordpress/icons';
import { store as singleStepStore } from '../../../../store/form-step-preview.js';
import StepIcon from '../../../form-step/icon.jsx';
import StepContainerIcon from '../../../form-step-container/icon.jsx';
import useStepNavigation from '../../hooks/use-step-navigation.js';
import { getStepLabel } from '../../util/step-labels.js';

/**
 * Toolbar controls for managing steps within a multi-step form.
 *
 * @param {object} props              - Component props.
 * @param {string} props.formClientId - Client ID of the root contact form block.
 * @return {import('react').JSX.Element} The rendered BlockControls component.
 */
export default function StepControls( { formClientId } ) {
	const { setActiveStep, enableSingleStepMode, disableSingleStepMode } =
		useDispatch( singleStepStore );

	// Use our custom navigation hook
	const { navigateToNextStep, navigateToPreviousStep, currentStepInfo, steps } = useStepNavigation(
		formClientId,
		false
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
										onClose();
									} }
									isSelected={ selectedStepId === step.clientId && isSingleStep }
									suffix={
										selectedStepId === step.clientId && isSingleStep ? (
											<Icon icon={ check } />
										) : null
									}
								>
									<Truncate limit={ 50 }>
										{ getStepLabel( index, step?.attributes?.stepLabel ) }
									</Truncate>
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
