import { BlockControls, store as blockEditorStore } from '@wordpress/block-editor';
import { createBlock } from '@wordpress/blocks';
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
import useParentFormClientId from '../../../../hooks/useParentFormClientId';
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
export default function StepControls( {
	formClientId = null,
	clientId = null,
	showToggle = true,
	showNavigation = true,
	updateStepSelected = false,
} ) {
	const { setPreviewStep, disablePreview, enablePreview } = useDispatch( previewStore );

	const { insertBlock, selectBlock } = useDispatch( blockEditorStore );

	formClientId = useParentFormClientId( clientId ) || formClientId;

	// Use our custom navigation hook
	const { navigateToNextStep, navigateToPreviousStep, currentStepInfo, steps } = useStepNavigation(
		formClientId,
		updateStepSelected
	);

	const { selectedStepId, isPreview, containerId } = useSelect(
		select => {
			const { isPreviewMode, getActivePreviewStepId } = select( previewStore );
			const { getBlock, getBlockParentsByBlockName } = select( blockEditorStore );
			const blockInfo = getBlock( clientId );
			let containerClientId = clientId;
			if ( blockInfo?.name === 'jetpack/form-step' ) {
				containerClientId = getBlockParentsByBlockName( clientId, [ 'jetpack/step-container' ] );
			}
			if ( clientId === formClientId ) {
				containerClientId = getBlockParentsByBlockName( steps[ 0 ].clientId, [
					'jetpack/step-container',
				] );
			}

			const selectedStepClientIdForForm = getActivePreviewStepId( formClientId );

			return {
				selectedStepId: selectedStepClientIdForForm,
				isPreview: isPreviewMode( formClientId ),
				containerId: containerClientId,
			};
		},
		[ formClientId, clientId, steps ]
	);

	// Don't render controls if there are no steps
	if ( ! steps || steps.length === 0 ) {
		return null;
	}

	const { stepLabel, index: currentStepIndex, isFirstStep, isLastStep } = currentStepInfo;

	// Format the display label
	let displayLabel;
	if ( ! isPreview ) {
		displayLabel = __( 'All Steps', 'jetpack-forms' );
	} else if ( currentStepIndex >= 0 ) {
		displayLabel = `${ currentStepIndex + 1 }. ${ stepLabel }`;
	} else {
		displayLabel = __( 'Select Step', 'jetpack-forms' );
	}

	// Custom function to insert a step container block after a specific block
	const insertStepAtIndex = ( targetId, index ) => {
		// Create a new step container block with default attributes
		const newStepBlock = createBlock(
			'jetpack/form-step',
			{
				stepLabel: __( 'New Step', 'jetpack-forms' ),
			},
			[]
		);

		insertBlock( newStepBlock, index, targetId );

		// Select the newly created block
		selectBlock( newStepBlock.clientId );

		// Set this as the preview step if in preview mode
		if ( isPreview ) {
			setPreviewStep( formClientId, newStepBlock.clientId );
		}
	};

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
										insertStepAtIndex( containerId, currentStepIndex - 1 );
										onClose();
									} }
								>
									{ __( 'Add Before Current Step', 'jetpack-forms' ) }
								</MenuItem>
							) }
							{ currentStepIndex !== -1 && (
								<MenuItem
									onClick={ () => {
										insertStepAtIndex( containerId, currentStepIndex + 1 );
										onClose();
									} }
								>
									{ __( 'Add After Current Step', 'jetpack-forms' ) }
								</MenuItem>
							) }
							<MenuItem
								onClick={ () => {
									insertStepAtIndex( containerId, 0 );
									onClose();
								} }
							>
								{ __( 'Add To Start', 'jetpack-forms' ) }
							</MenuItem>
							<MenuItem
								onClick={ () => {
									insertStepAtIndex( containerId, steps.length );
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
