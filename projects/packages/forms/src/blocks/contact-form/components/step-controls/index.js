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
	ToolbarItem,
} from '@wordpress/components';
import { useDispatch, useSelect } from '@wordpress/data';
import { useCallback, useEffect } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { next, previous } from '@wordpress/icons';

// Define a constant for the "All Steps" option value
const ALL_STEPS_VALUE = '__all__';

// Transition options
const TRANSITION_OPTIONS = [
	{ label: __( 'None', 'jetpack-forms' ), value: 'none' },
	{ label: __( 'Fade', 'jetpack-forms' ), value: 'fade' },
	{ label: __( 'Slide', 'jetpack-forms' ), value: 'slide' },
	{ label: __( 'Fade & Slide', 'jetpack-forms' ), value: 'fade-slide' },
];

/**
 * Toolbar controls for managing steps within a multi-step form.
 *
 * @param {object}   props                      - Component props.
 * @param {string}   props.clientId             - Client ID of the parent contact form block.
 * @param {string}   props.selectedStepClientId - The client ID of the currently selected step (or ALL_STEPS_VALUE).
 * @param {Function} props.setParentAttributes  - Function to set attributes on the parent block.
 * @param {string}   props.stepTransition       - The current transition style for step animations (none, fade, slide, or fade-slide).
 * @return {JSX.Element} The rendered BlockControls component.
 */
export default function StepControls( {
	clientId,
	selectedStepClientId,
	setParentAttributes,
	stepTransition = 'fade-slide',
} ) {
	const { insertBlock } = useDispatch( blockEditorStore );

	const { steps, isFirstStep, isLastStep, selectedBlockClientId } = useSelect(
		select => {
			const { getBlocks, getSelectedBlockClientId } = select( blockEditorStore );
			const innerBlocks = getBlocks( clientId );
			let stepBlocks = innerBlocks.filter( block => block.name === 'jetpack/form-step' );

			if ( stepBlocks.length === 0 ) {
				const stepContainer = innerBlocks.find( block => block.name === 'jetpack/step-container' );
				stepBlocks = stepContainer ? getBlocks( stepContainer.clientId ) : [];
			}

			return {
				steps: stepBlocks,
				isFirstStep: stepBlocks[ 0 ]?.clientId === selectedStepClientId,
				isLastStep: stepBlocks[ stepBlocks.length - 1 ]?.clientId === selectedStepClientId,
				selectedBlockClientId: getSelectedBlockClientId(),
			};
		},
		[ clientId, selectedStepClientId ]
	);

	// Handle step selection change - directly update the parent attribute.
	const handleStepChange = useCallback(
		newStepClientId => {
			setParentAttributes( { selectedStepClientId: newStepClientId } );
		},
		[ setParentAttributes ]
	);

	// Handle transition style change
	const handleTransitionChange = useCallback(
		newTransitionStyle => {
			setParentAttributes( { stepTransition: newTransitionStyle } );
		},
		[ setParentAttributes ]
	);

	// Create a new step block with the given label
	const createStepBlock = ( label = __( 'New Step', 'jetpack-forms' ) ) => {
		return createBlock( 'jetpack/form-step', {
			stepLabel: label,
		} );
	};

	// Function to add a new step at the end
	const addStepAtEnd = () => {
		const newStep = createStepBlock();
		insertBlock( newStep, steps.length, clientId );

		// Only change view to the new step if not in ALL_STEPS_VALUE view
		if ( selectedStepClientId !== ALL_STEPS_VALUE ) {
			setTimeout( () => {
				setParentAttributes( { selectedStepClientId: newStep.clientId } );
			}, 0 );
		}
	};

	// Function to add a step before the current step
	const addStepBefore = () => {
		if ( selectedStepClientId === ALL_STEPS_VALUE ) {
			return;
		}

		const currentStepIndex = steps.findIndex( step => step.clientId === selectedStepClientId );
		if ( currentStepIndex === -1 ) {
			return;
		}

		const newStep = createStepBlock();
		insertBlock( newStep, currentStepIndex, clientId );

		// Select the newly created step
		setTimeout( () => {
			setParentAttributes( { selectedStepClientId: newStep.clientId } );
		}, 0 );
	};

	// Function to add a step after the current step
	const addStepAfter = () => {
		if ( selectedStepClientId === ALL_STEPS_VALUE ) {
			return;
		}

		const currentStepIndex = steps.findIndex( step => step.clientId === selectedStepClientId );
		if ( currentStepIndex === -1 ) {
			return;
		}

		const newStep = createStepBlock();
		insertBlock( newStep, currentStepIndex + 1, clientId );

		// Select the newly created step
		setTimeout( () => {
			setParentAttributes( { selectedStepClientId: newStep.clientId } );
		}, 0 );
	};

	// Sync List View selection with step preview
	useEffect( () => {
		// Don't update if we're in "All Steps" view
		if ( selectedStepClientId === ALL_STEPS_VALUE ) {
			return;
		}

		// Check if the selected block is one of our steps
		const isStepSelected = steps.some( step => step.clientId === selectedBlockClientId );

		// If a step is selected in List View but it's different from our current preview, update it
		if ( isStepSelected && selectedBlockClientId !== selectedStepClientId ) {
			handleStepChange( selectedBlockClientId );
		}
	}, [ selectedBlockClientId, steps, selectedStepClientId, handleStepChange ] );

	// Effect to validate selectedStepClientId when steps change (e.g., a step is deleted)
	useEffect( () => {
		if ( ! steps || steps.length === 0 ) {
			// If we have no steps, and a step selection still exists, clear it.
			// Keep ALL_STEPS_VALUE if it's already set.
			if (
				selectedStepClientId &&
				selectedStepClientId !== ALL_STEPS_VALUE &&
				setParentAttributes
			) {
				setParentAttributes( { selectedStepClientId: ALL_STEPS_VALUE } );
			}
			return;
		}

		// Check if the current selection is actually invalid (i.e., not ALL_STEPS and not in the current steps array)
		const isTrulyInvalidSelection =
			selectedStepClientId !== ALL_STEPS_VALUE &&
			! steps.some( step => step.clientId === selectedStepClientId );

		// If the current selection is truly invalid (e.g., selected step was deleted), default to the first step.
		if ( isTrulyInvalidSelection && setParentAttributes ) {
			setParentAttributes( { selectedStepClientId: steps[ 0 ].clientId } );
		}
	}, [ steps, selectedStepClientId, setParentAttributes ] );

	// Don't render controls if there are no steps
	if ( ! steps || steps.length === 0 ) {
		return null;
	}

	// Determine the current step label and index
	const getCurrentStepInfo = () => {
		if ( selectedStepClientId === ALL_STEPS_VALUE ) {
			return { label: __( 'All Steps', 'jetpack-forms' ), index: -1 };
		}

		const currentStepIndex = steps.findIndex( step => step.clientId === selectedStepClientId );
		if ( currentStepIndex >= 0 ) {
			const currentStepLabel = steps[ currentStepIndex ]?.attributes?.stepLabel || '';
			return {
				label: `${ currentStepIndex + 1 }. ${ currentStepLabel }`,
				index: currentStepIndex,
			};
		}

		return { label: __( 'Select Step', 'jetpack-forms' ), index: -1 };
	};

	const { label: currentStepLabel, index: currentStepIndex } = getCurrentStepInfo();
	const isPreviewMode = selectedStepClientId !== ALL_STEPS_VALUE;

	// Get the current transition label
	const currentTransitionLabel =
		TRANSITION_OPTIONS.find( option => option.value === stepTransition )?.label ||
		TRANSITION_OPTIONS.find( option => option.value === 'fade-slide' ).label;

	return (
		<BlockControls>
			<ToolbarGroup>
				<ToolbarButton
					onClick={ () => handleStepChange( ALL_STEPS_VALUE ) }
					isPressed={ selectedStepClientId === ALL_STEPS_VALUE }
				>
					{ __( 'All Steps', 'jetpack-forms' ) }
				</ToolbarButton>
				<ToolbarButton
					onClick={ () => {
						if ( selectedStepClientId === ALL_STEPS_VALUE && steps.length > 0 ) {
							handleStepChange( steps[ 0 ].clientId );
						}
					} }
					isPressed={ selectedStepClientId !== ALL_STEPS_VALUE }
				>
					{ __( 'Preview', 'jetpack-forms' ) }
				</ToolbarButton>

				{ /* Add Transition Style Dropdown */ }
				<DropdownMenu
					label={ __( 'Transition Style', 'jetpack-forms' ) }
					icon={ null }
					toggleProps={ {
						children: (
							<>
								{ __( 'Transition:', 'jetpack-forms' ) }
								<span style={ { width: '8px' } } /> { /* Spacer */ }
								{ currentTransitionLabel }
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
					} }
					popoverProps={ { placement: 'bottom-start' } }
				>
					{ ( { onClose } ) => (
						<MenuGroup>
							{ TRANSITION_OPTIONS.map( ( { label, value } ) => (
								<MenuItem
									key={ value }
									onClick={ () => {
										handleTransitionChange( value );
										onClose();
									} }
									isSelected={ stepTransition === value }
									icon={ stepTransition === value ? 'yes' : null }
								>
									{ label }
								</MenuItem>
							) ) }
						</MenuGroup>
					) }
				</DropdownMenu>

				{ /* Step selection dropdown - only shown in Preview mode */ }
				{ isPreviewMode && (
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
										isSelected={ selectedStepClientId === step.clientId }
										icon={ selectedStepClientId === step.clientId ? 'yes' : null }
									>
										{ `${ index + 1 }. ${ step?.attributes?.stepLabel }` }
									</MenuItem>
								) ) }
							</MenuGroup>
						) }
					</DropdownMenu>
				) }

				{ /* Navigation buttons - only shown in Preview mode */ }
				{ isPreviewMode && (
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
								if ( currentStepIndex < steps.length - 1 ) {
									handleStepChange( steps[ currentStepIndex + 1 ].clientId );
								}
							} }
						>
							<Icon icon={ next } />
						</ToolbarButton>
					</>
				) }
			</ToolbarGroup>
			<ToolbarGroup>
				{ /* Add step button */ }
				{ ! isPreviewMode ? (
					<ToolbarButton
						showTooltip={ true }
						label={ __( 'Add Step', 'jetpack-forms' ) }
						onClick={ addStepAtEnd }
					>
						{ __( 'Add', 'jetpack-forms' ) }
					</ToolbarButton>
				) : (
					<ToolbarItem>
						{ () => (
							<DropdownMenu
								icon={ null }
								label={ __( 'Add Step', 'jetpack-forms' ) }
								toggleProps={ {
									children: __( 'Add', 'jetpack-forms' ),
								} }
								controls={ [
									{
										title: __( 'Add Step Before', 'jetpack-forms' ),
										onClick: addStepBefore,
									},
									{
										title: __( 'Add Step After', 'jetpack-forms' ),
										onClick: addStepAfter,
									},
									{
										title: __( 'Add Step at End', 'jetpack-forms' ),
										onClick: addStepAtEnd,
									},
								] }
							/>
						) }
					</ToolbarItem>
				) }
			</ToolbarGroup>
		</BlockControls>
	);
}
