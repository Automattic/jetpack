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

/**
 * Toolbar controls for managing steps within a multi-step form.
 *
 * @param {object}  props          - Component props.
 * @param {string}  props.clientId - Client ID of the parent contact form block.
 * @param {boolean} props.onlyNav  - Flag to indicate if only navigation buttons should be shown.
 * @param {boolean} props.isStep   - Flag to indicate if the current block is a step.
 * @return {JSX.Element} The rendered BlockControls component.
 */
export default function StepControls( { clientId, onlyNav = false, isStep = false } ) {
	const { insertBlock } = useDispatch( blockEditorStore );

	const { steps, isFirstStep, isLastStep, selectedBlockClientId, formClientId, selectedStepId } =
		useSelect(
			select => {
				const {
					getBlocks,
					getSelectedBlockClientId,
					getBlockAttributes,
					getBlockParentsByBlockName,
				} = select( blockEditorStore );

				const parentIds = getBlockParentsByBlockName( clientId, 'jetpack/contact-form' );
				const formId = parentIds.length ? parentIds[ 0 ] : clientId;

				const { selectedStepClientId } = getBlockAttributes( formId );
				const innerBlocks = getBlocks( formId );

				let stepBlocks = innerBlocks.filter( block => block.name === 'jetpack/form-step' );

				if ( stepBlocks.length === 0 ) {
					const stepContainer = innerBlocks.find(
						block => block.name === 'jetpack/step-container'
					);
					stepBlocks = stepContainer ? getBlocks( stepContainer.clientId ) : [];
				}

				return {
					steps: stepBlocks,
					formClientId: formId,
					selectedStepId: selectedStepClientId || ALL_STEPS_VALUE,
					isFirstStep: stepBlocks[ 0 ]?.clientId === selectedStepClientId,
					isLastStep: stepBlocks[ stepBlocks.length - 1 ]?.clientId === selectedStepClientId,
					selectedBlockClientId: getSelectedBlockClientId(),
				};
			},
			[ clientId ]
		);

	const { updateBlockAttributes, selectBlock } = useDispatch( 'core/block-editor' );

	const setParentAttributes = useCallback(
		attributes => {
			if ( formClientId ) {
				updateBlockAttributes( formClientId, attributes );
			}
		},
		[ formClientId, updateBlockAttributes ]
	);

	// Handle step selection change - directly update the parent attribute.
	const handleStepChange = useCallback(
		newStepClientId => {
			setParentAttributes( { selectedStepClientId: newStepClientId } );
			if ( isStep ) {
				selectBlock( newStepClientId );
			}
		},
		[ setParentAttributes, selectBlock, isStep ]
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
		if ( selectedStepId !== ALL_STEPS_VALUE ) {
			setTimeout( () => {
				setParentAttributes( { selectedStepClientId: newStep.clientId } );
			}, 0 );
		}
	};

	// Function to add a step before the current step
	const addStepBefore = () => {
		if ( selectedStepId === ALL_STEPS_VALUE ) {
			return;
		}

		const currentStepIndex = steps.findIndex( step => step.clientId === selectedStepId );
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
		if ( selectedStepId === ALL_STEPS_VALUE ) {
			return;
		}

		const currentStepIndex = steps.findIndex( step => step.clientId === selectedStepId );
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
		if ( selectedStepId === ALL_STEPS_VALUE ) {
			return;
		}

		if ( isStep ) {
			return;
		}

		// Check if the selected block is one of our steps
		const isStepSelected = steps.some( step => step.clientId === selectedBlockClientId );

		// If a step is selected in List View but it's different from our current preview, update it
		if ( isStepSelected && selectedBlockClientId !== selectedStepId ) {
			// handleStepChange( selectedBlockClientId );
		}
	}, [ selectedBlockClientId, steps, selectedStepId, handleStepChange, isStep ] );

	// Effect to validate selectedStepId when steps change (e.g., a step is deleted)
	useEffect( () => {
		if ( ! steps || steps.length === 0 ) {
			// If we have no steps, and a step selection still exists, clear it.
			// Keep ALL_STEPS_VALUE if it's already set.
			if ( selectedStepId && selectedStepId !== ALL_STEPS_VALUE && setParentAttributes ) {
				setParentAttributes( { selectedStepId: ALL_STEPS_VALUE } );
			}
			return;
		}

		// Check if the current selection is actually invalid (i.e., not ALL_STEPS and not in the current steps array)
		const isTrulyInvalidSelection =
			selectedStepId !== ALL_STEPS_VALUE &&
			! steps.some( step => step.clientId === selectedStepId );

		// If the current selection is truly invalid (e.g., selected step was deleted), default to the first step.
		if ( isTrulyInvalidSelection && setParentAttributes ) {
			setParentAttributes( { selectedStepId: steps[ 0 ].clientId } );
		}
	}, [ steps, selectedStepId, setParentAttributes ] );

	// Determine the current step label and index
	const getCurrentStepInfo = useCallback( () => {
		if ( selectedStepId === ALL_STEPS_VALUE ) {
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
	const isPreviewMode = selectedStepId !== ALL_STEPS_VALUE;

	return (
		<BlockControls>
			<ToolbarGroup>
				{ ! onlyNav && (
					<>
						<ToolbarButton
							onClick={ () => handleStepChange( ALL_STEPS_VALUE ) }
							isPressed={ selectedStepId === ALL_STEPS_VALUE }
						>
							{ __( 'All Steps', 'jetpack-forms' ) }
						</ToolbarButton>
						<ToolbarButton
							onClick={ () => {
								if ( selectedStepId === ALL_STEPS_VALUE && steps.length > 0 ) {
									handleStepChange( steps[ 0 ].clientId );
								}
							} }
							isPressed={ selectedStepId !== ALL_STEPS_VALUE }
						>
							{ __( 'Preview', 'jetpack-forms' ) }
						</ToolbarButton>{ ' ' }
					</>
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

				{ /* Step selection dropdown - only shown in Preview mode */ }
				{ ! onlyNav && isPreviewMode && (
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
			{ ! onlyNav && (
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
			) }
		</BlockControls>
	);
}
