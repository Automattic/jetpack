import { BlockControls } from '@wordpress/block-editor';
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
import { __ } from '@wordpress/i18n';
import { next, previous } from '@wordpress/icons';
import useStepNavigation from '../../../../hooks/use-step-navigation';
import { store as previewStore } from '../../../../store/preview-store';

/**
 * Toolbar controls for managing steps within a multi-step form.
 *
 * @param {object}  props                    - Component props.
 * @param {string}  props.formClientId       - Client ID of the root contact form block.
 * @param {boolean} props.showToggle         - Flag to indicate if toggle buttons should be shown.
 * @param {boolean} props.showNavigation     - Flag to indicate if navigation controls should be shown.
 * @param {boolean} props.updateStepSelected - Flag to indicate if the step should be selected.
 * @return {JSX.Element} The rendered BlockControls component.
 */
export default function StepControls( {
	formClientId = null,
	showToggle = true,
	showNavigation = true,
	updateStepSelected = false,
} ) {
	const { setPreviewStep, disablePreview, enablePreview } = useDispatch( previewStore );

	// Use our custom navigation hook
	const { navigateToNextStep, navigateToPreviousStep, currentStepInfo, steps } = useStepNavigation(
		formClientId,
		updateStepSelected
	);

	const { selectedStepId, isPreview } = useSelect(
		select => {
			const { isPreviewMode, getActivePreviewStepId } = select( previewStore );
			const selectedStepClientIdForForm = getActivePreviewStepId( formClientId );

			return {
				selectedStepId: selectedStepClientIdForForm,
				isPreview: isPreviewMode( formClientId ),
			};
		},
		[ formClientId ]
	);

	// Don't render controls if there are no steps
	if ( ! steps || steps.length === 0 ) {
		return null;
	}

	const { stepLabel, index: currentStepIndex, isFirstStep, isLastStep } = currentStepInfo;

	// Format the display label
	let displayLabel;
	if ( ! isPreview ) {
		displayLabel = __( 'All steps', 'jetpack-forms' );
	} else if ( currentStepIndex >= 0 ) {
		if ( stepLabel ) {
			const shorterLabel =
				stepLabel.length > 12 ? `${ stepLabel.substring( 0, 12 ) }...` : stepLabel;
			displayLabel = `${ currentStepIndex + 1 } ${ shorterLabel }`;
		} else {
			displayLabel = `${ currentStepIndex + 1 } Step`;
		}
	} else {
		displayLabel = __( 'Select step', 'jetpack-forms' );
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
						<ToolbarButton
							showTooltip={ true }
							label={ __( 'Previous step', 'jetpack-forms' ) }
							disabled={ isFirstStep }
							onClick={ navigateToPreviousStep }
						>
							<Icon icon={ previous } />
						</ToolbarButton>
						<ToolbarButton
							showTooltip={ true }
							label={ __( 'Next step', 'jetpack-forms' ) }
							disabled={ isLastStep }
							onClick={ navigateToNextStep }
						>
							<Icon icon={ next } />
						</ToolbarButton>
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
