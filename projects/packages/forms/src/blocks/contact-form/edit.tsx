/*
 * External dependencies
 */
import { ThemeProvider } from '@automattic/jetpack-components';
import { useModuleStatus } from '@automattic/jetpack-shared-extension-utils';
import {
	URLInput,
	InspectorAdvancedControls,
	InspectorControls,
	useBlockProps,
	InnerBlocks,
	useInnerBlocksProps,
	store as blockEditorStore,
	BlockControls,
	BlockContextProvider,
} from '@wordpress/block-editor';
import { createBlock } from '@wordpress/blocks';
import {
	ExternalLink,
	PanelBody,
	TextareaControl,
	TextControl,
	ToggleControl,
	RadioControl,
} from '@wordpress/components';
import { useInstanceId } from '@wordpress/compose';
import { store as coreStore } from '@wordpress/core-data';
import { useSelect, useDispatch } from '@wordpress/data';
import { store as editorStore } from '@wordpress/editor';
import { useRef, useEffect, useCallback, lazy, Suspense } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import clsx from 'clsx';
/*
 * Internal dependencies
 */
import useConfigValue from '../../hooks/use-config-value';
import { store as singleStepStore } from '../../store/form-step-preview';
import {
	PREVIOUS_BUTTON_TEMPLATE,
	NEXT_BUTTON_TEMPLATE,
	NAVIGATION_TEMPLATE,
} from '../form-step-navigation/edit';
import StepControls from '../shared/components/form-step-controls';
import JetpackManageResponsesSettings from '../shared/components/jetpack-manage-responses-settings';
import { useFindBlockRecursively } from '../shared/hooks/use-find-block-recursively';
import useFormSteps from '../shared/hooks/use-form-steps';
import { SyncedAttributeProvider } from '../shared/hooks/use-synced-attributes';
import { CORE_BLOCKS } from '../shared/util/constants';
import { childBlocks } from './child-blocks';
import { ContactFormPlaceholder } from './components/jetpack-contact-form-placeholder';
import ContactFormSkeletonLoader from './components/jetpack-contact-form-skeleton-loader';
import NotificationsSettings from './components/notifications-settings';
import useFormBlockDefaults from './shared/hooks/use-form-block-defaults';
import VariationPicker from './variation-picker';
import './util/form-styles.js';

const IntegrationControls = lazy( () => import( './components/jetpack-integration-controls' ) );

// Transforms
const FormTransitionState = {
	TO_MULTISTEP: 'to-multistep',
	TO_FORM: 'to-form',
	IS_MULTISTEP: 'is-multistep',
	IS_FORM: 'is-form',
};

const validFields = childBlocks.filter( childBlock => {
	const settings = childBlock.settings as typeof childBlock.settings & {
		parent?: string | string[];
	};

	return (
		! settings.parent ||
		settings.parent === 'jetpack/contact-form' ||
		( Array.isArray( settings.parent ) && settings.parent.includes( 'jetpack/contact-form' ) )
	);
} );

const ALLOWED_BLOCKS = [ ...validFields.map( block => `jetpack/${ block.name }` ) ];

// At the top level of a multistep form we allow navigation, progress indicator
// and the step-container itself (users may add it manually before steps are
// auto-structured). The core block list remains unchanged.
const ALLOWED_MULTI_STEP_BLOCKS = [
	'jetpack/form-step-navigation',
	'jetpack/form-progress-indicator',
	'jetpack/form-step-container',
	'jetpack/form-step-divider',
].concat( CORE_BLOCKS );

const REMOVE_FIELDS_FROM_FORM = [
	'jetpack/form-step-navigation',
	'jetpack/form-progress-indicator',
	'jetpack/form-step-container',
];

const ALLOWED_FORM_BLOCKS = ALLOWED_BLOCKS.concat( CORE_BLOCKS ).filter(
	block => ! REMOVE_FIELDS_FROM_FORM.includes( block )
);

const PRIORITIZED_INSERTER_BLOCKS = [ ...validFields.map( block => `jetpack/${ block.name }` ) ];

// Determine if a block has a required attribute. Exclude hidden fields.
const isInputWithRequiredField = ( fullName?: string ): boolean => {
	if ( ! fullName || ! fullName.startsWith( 'jetpack/' ) ) return false;
	const baseName = fullName.slice( 'jetpack/'.length );
	const field = childBlocks.find( block => block.name === baseName );
	// @ts-expect-error: childBlocks are defined in JS without explicit types.
	// TS is inferring the type wrong. Fix is to update childBlocks to TS with types.
	const hasRequired = field && field?.settings?.attributes?.required !== undefined;
	const isHidden = field?.name === 'field-hidden';
	return hasRequired && ! isHidden;
};

type CustomThankyouType =
	| '' // default message
	| 'noSummary' // default message without a summary
	| 'message' // custom message
	| 'redirect'; // redirect to a new URL

type JetpackContactFormAttributes = {
	to: string;
	subject: string;
	// Legacy support for the customThankyou attribute
	customThankyou: CustomThankyouType;
	customThankyouHeading: string;
	customThankyouMessage: string;
	customThankyouRedirect: string;
	confirmationType: 'text' | 'redirect';
	formTitle: string;
	variationName: string;
	emailNotifications: boolean;
	disableGoBack: boolean;
	disableSummary: boolean;
	notificationRecipients: string[];
};
type JetpackContactFormEditProps = {
	name: string;
	attributes: JetpackContactFormAttributes;
	setAttributes: ( attributes: Partial< JetpackContactFormAttributes > ) => void;
	clientId: string;
	className: string;
};

function JetpackContactFormEdit( {
	name,
	attributes,
	setAttributes,
	clientId,
	className,
}: JetpackContactFormEditProps ) {
	// Initialize default form block settings as needed.
	useFormBlockDefaults( { attributes, setAttributes } );

	const {
		to,
		subject,
		customThankyou,
		customThankyouHeading,
		customThankyouMessage,
		customThankyouRedirect,
		confirmationType,
		formTitle,
		variationName,
		emailNotifications,
		disableGoBack,
		disableSummary,
		notificationRecipients,
	} = attributes;
	const showFormIntegrations = useConfigValue( 'isIntegrationsEnabled' );
	const instanceId = useInstanceId( JetpackContactFormEdit );

	// Backward compatibility for the deprecated customThankyou attribute.
	// Older forms will have a customThankyou attribute set, but not a confirmationType attribute
	// and not a disableSummary attribute, so we need to set it here.
	useEffect( () => {
		if ( confirmationType ) {
			return;
		}

		if ( customThankyou === 'redirect' ) {
			setAttributes( { confirmationType: 'redirect' } );
		} else {
			setAttributes( { confirmationType: 'text' } );

			if ( [ 'noSummary', 'message' ].includes( customThankyou ) ) {
				setAttributes( { disableSummary: true } );
			}
		}
	}, [ confirmationType, customThankyou, setAttributes ] );

	const steps = useFormSteps( clientId );

	// Get current step info for context
	const currentStepInfo = useSelect(
		select => select( singleStepStore ).getCurrentStepInfo( clientId, steps ),
		[ clientId, steps ]
	);

	const submitButton = useFindBlockRecursively(
		clientId,
		block => block.name === 'jetpack/button'
	);

	const { postTitle, hasAnyInnerBlocks, postAuthorEmail, selectedBlockClientId, onlySubmitBlock } =
		useSelect(
			select => {
				const { getBlocks, getBlock, getSelectedBlockClientId, getBlockParentsByBlockName } =
					select( blockEditorStore );
				const { getEditedPostAttribute } = select( editorStore );
				const selectedBlockId = getSelectedBlockClientId();
				const selectedBlock = getBlock( selectedBlockId );
				let selectedStepBlockId = selectedBlockId;

				if ( selectedBlock && selectedBlock.name !== 'jetpack/form-step' ) {
					selectedStepBlockId = getBlockParentsByBlockName(
						selectedBlockId,
						'jetpack/form-step'
					)[ 0 ];
				}

				const { getUser } = select( coreStore );
				const innerBlocksData = getBlocks( clientId );

				const title = getEditedPostAttribute( 'title' );
				const authorId = getEditedPostAttribute( 'author' );
				const authorEmail = authorId && getUser( authorId )?.email;

				return {
					postTitle: title,
					hasAnyInnerBlocks: innerBlocksData.length > 0,
					postAuthorEmail: authorEmail,
					selectedBlockClientId: selectedStepBlockId,
					onlySubmitBlock:
						innerBlocksData.length === 1 && innerBlocksData[ 0 ].name === 'jetpack/button',
				};
			},
			[ clientId ]
		);

	useEffect( () => {
		if ( submitButton && ! submitButton.attributes.lock ) {
			const lock = { move: false, remove: true };
			submitButton.attributes.lock = lock;
		}
	}, [ submitButton ] );

	const { isSingleStep, isFirstStep, isLastStep, currentStepClientId } = useSelect(
		select => {
			const { getCurrentStepInfo, isSingleStepMode } = select( singleStepStore );

			const info = getCurrentStepInfo( clientId, steps );

			return {
				isSingleStep: isSingleStepMode( clientId ),
				isFirstStep: info ? info.isFirstStep : false,
				isLastStep: info ? info.isLastStep : false,
				currentStepClientId: info ? info.clientId : null,
			};
		},
		[ clientId, steps ]
	);

	const wrapperRef = useRef();
	const innerRef = useRef();
	const blockProps = useBlockProps( { ref: wrapperRef } );
	const formClassnames = clsx(
		className,
		'jetpack-contact-form',
		isFirstStep && 'is-first-step',
		isLastStep && 'is-last-step',
		variationName === 'multistep' && isSingleStep && 'is-previewing-step'
	);
	const innerBlocksProps = useInnerBlocksProps(
		{
			ref: innerRef,
			className: formClassnames,
			style: window.jetpackForms.generateStyleVariables( innerRef.current ),
		},
		{
			allowedBlocks:
				variationName === 'multistep' ? ALLOWED_MULTI_STEP_BLOCKS : ALLOWED_FORM_BLOCKS,
			prioritizedInserterBlocks: PRIORITIZED_INSERTER_BLOCKS,
			templateInsertUpdatesSelection: false,
		}
	);
	const { isLoadingModules, isChangingStatus, isModuleActive, changeStatus } =
		useModuleStatus( 'contact-form' );

	const { replaceInnerBlocks, __unstableMarkNextChangeAsNotPersistent, updateBlockAttributes } =
		useDispatch( blockEditorStore );

	const currentInnerBlocks = useSelect(
		select => select( blockEditorStore ).getBlocks( clientId ),
		[ clientId ]
	);

	// Track previous block count to detect insertions
	const previousBlockCountRef = useRef( currentInnerBlocks.length );

	// Helper function to identify input field blocks
	const getInputFieldBlocks = useCallback( blocks => {
		const inputFields = [];

		const findInputFields = blockList => {
			blockList.forEach( block => {
				if ( isInputWithRequiredField( block.name ) ) {
					inputFields.push( block );
				}
				// Recursively check inner blocks (for multistep forms)
				if ( block.innerBlocks && block.innerBlocks.length > 0 ) {
					findInputFields( block.innerBlocks );
				}
			} );
		};

		findInputFields( blocks );
		return inputFields;
	}, [] );

	// Effect to handle block insertion and reordering
	useEffect( () => {
		const currentBlockCount = currentInnerBlocks.length;
		const previousBlockCount = previousBlockCountRef.current;

		// Detect if a block was just inserted
		const blockWasInserted = currentBlockCount > previousBlockCount;

		if ( blockWasInserted && currentInnerBlocks.length > 1 ) {
			// Find the submit button
			const submitButtonIndex = currentInnerBlocks.findIndex(
				block =>
					block.name === 'jetpack/button' &&
					( block.attributes?.customVariant === 'submit' || block.attributes?.element === 'button' )
			);

			// If there's a submit button and it's not the last block, reorder
			if ( submitButtonIndex !== -1 && submitButtonIndex === currentInnerBlocks.length - 2 ) {
				// Move the submit button to the end
				const reorderedBlocks = [ ...currentInnerBlocks ];
				const [ submitButtonBlock ] = reorderedBlocks.splice( submitButtonIndex, 1 );
				reorderedBlocks.push( submitButtonBlock );

				// Update the blocks without creating an undo step
				__unstableMarkNextChangeAsNotPersistent();
				replaceInnerBlocks( clientId, reorderedBlocks, false );
			}
		}

		// Update the previous block count
		previousBlockCountRef.current = currentBlockCount;
	}, [
		currentInnerBlocks,
		clientId,
		replaceInnerBlocks,
		__unstableMarkNextChangeAsNotPersistent,
	] );

	// Effect to automatically make single input fields required
	useEffect( () => {
		const inputFields = getInputFieldBlocks( currentInnerBlocks );

		// Only proceed if there's exactly one input field
		if ( inputFields.length === 1 ) {
			const singleField = inputFields[ 0 ];

			// Check if the field is not already required
			if ( ! singleField.attributes?.required ) {
				// Update the field to be required
				updateBlockAttributes( singleField.clientId, { required: true } );
			}
		}
	}, [ currentInnerBlocks, getInputFieldBlocks, updateBlockAttributes ] );

	// Deep-scan helper – user might drop a Step block inside nested structures.
	const containsMultistepBlock = useCallback( function hasMultistep( blocks ) {
		return blocks.some(
			b =>
				b.name === 'jetpack/form-step' ||
				b.name === 'jetpack/form-step-container' ||
				b.name === 'jetpack/form-step-divider' ||
				( b.innerBlocks?.length && hasMultistep( b.innerBlocks ) )
		);
	}, [] );

	// Detect a conversion to a multistep form and structure inner blocks only once.
	const formTransitionStateRef = useRef< string | null >( null );

	useEffect( () => {
		const hasMultistepBlock = containsMultistepBlock( currentInnerBlocks );

		// Transition to single-step form state if no multistep blocks are present
		// and the variation is not set to 'multistep'.
		if ( ! hasMultistepBlock && variationName !== 'multistep' ) {
			formTransitionStateRef.current = FormTransitionState.IS_FORM;
			return;
		}

		// Transition to multistep form state if multistep blocks are present
		// and the variation is set to 'multistep'.
		if ( variationName === 'multistep' && hasMultistepBlock ) {
			formTransitionStateRef.current = FormTransitionState.IS_MULTISTEP;
			return;
		}

		// Transition from multistep form state to single-step form state.
		if ( formTransitionStateRef.current === FormTransitionState.IS_MULTISTEP ) {
			formTransitionStateRef.current = FormTransitionState.TO_FORM;
			return;
		}

		// Transition from single-step form state to multistep form state.
		formTransitionStateRef.current = FormTransitionState.TO_MULTISTEP;

		// If the form is not multistep, we don't need to do anything.
	}, [ variationName, currentInnerBlocks, containsMultistepBlock ] );

	useEffect( () => {
		// Early exit if we are still on the multistep variation or if there are
		// no multistep-specific blocks to clean up.
		if ( formTransitionStateRef.current !== FormTransitionState.TO_MULTISTEP ) {
			return;
		}

		/*
		 * Only skip the expensive restructuring logic when the form is **already in a
		 * fully-structured multistep shape**:
		 *   – exactly one `jetpack/step-container` anywhere in the block tree, and
		 *   – there are **no** `form-step` blocks that live outside that container.
		 * In all other cases we still need to normalise the tree (e.g. when the user
		 * inserts a Step Container while other fields remain outside of it).
		 */
		const countBlocks = ( blocks, predicate ) =>
			blocks.reduce(
				( acc, b ) =>
					acc + ( predicate( b ) ? 1 : 0 ) + countBlocks( b.innerBlocks || [], predicate ),
				0
			);

		const stepContainerCount = countBlocks(
			currentInnerBlocks,
			b => b.name === 'jetpack/form-step-container'
		);

		// Helper: detect any form-step that is NOT inside a step-container.
		const hasStrayFormStep = ( blocks, insideContainer = false ) => {
			for ( const b of blocks ) {
				const newInside = insideContainer || b.name === 'jetpack/form-step-container';
				if ( b.name === 'jetpack/form-step' && ! newInside ) {
					return true;
				}
				if ( b.innerBlocks?.length && hasStrayFormStep( b.innerBlocks, newInside ) ) {
					return true;
				}
			}
			return false;
		};

		const formIsFullyStructured =
			stepContainerCount === 1 && ! hasStrayFormStep( currentInnerBlocks );

		if ( formIsFullyStructured ) {
			return;
		}

		// Helper functions
		const findButtonBlock = () => {
			const buttonIndex = currentInnerBlocks.findIndex( block => block.name === 'jetpack/button' );
			return buttonIndex !== -1
				? {
						block: currentInnerBlocks[ buttonIndex ],
						index: buttonIndex,
				  }
				: null;
		};

		const prepareSubmitButton = button => {
			if ( ! button ) return null;

			const preparedButton = button;
			preparedButton.attributes.uniqueId = 'submit-step';
			preparedButton.attributes.customVariant = 'submit';
			preparedButton.attributes.metaName = __( 'Submit button', 'jetpack-forms' );
			return preparedButton;
		};

		const createStepNavigation = button => {
			// Find existing navigation block or create new one
			const existingNavigation = currentInnerBlocks.find(
				block => block.name === 'jetpack/form-step-navigation'
			);

			if ( existingNavigation && button ) {
				// Add button to existing navigation
				return createBlock( 'jetpack/form-step-navigation', existingNavigation.attributes, [
					...( existingNavigation.innerBlocks || [] ),
					button,
				] );
			} else if ( existingNavigation ) {
				return existingNavigation;
			}

			// Create new navigation with or without button
			return createBlock(
				'jetpack/form-step-navigation',
				{
					layout: {
						type: 'flex',
						justifyContent: 'right',
					},
				},
				button
					? [ createBlock( PREVIOUS_BUTTON_TEMPLATE ), createBlock( NEXT_BUTTON_TEMPLATE ), button ]
					: NAVIGATION_TEMPLATE.map( createBlock )
			);
		};

		const getProgressIndicator = () => {
			const existingIndicator = currentInnerBlocks.find(
				block => block.name === 'jetpack/form-progress-indicator'
			);
			return existingIndicator || createBlock( 'jetpack/form-progress-indicator', {}, [] );
		};

		// 1. Extract button if it exists
		const buttonData = findButtonBlock();
		const buttonBlock = buttonData ? buttonData.block : null;

		// 2. Get blocks excluding the button
		const blocksWithoutButton = buttonData
			? currentInnerBlocks.filter( ( _, index ) => index !== buttonData.index )
			: currentInnerBlocks;

		// 3. Prepare step container based on current blocks
		let stepBlocks = [];

		const containerIndex = blocksWithoutButton.findIndex(
			block => block.name === 'jetpack/form-step-container'
		);

		if ( containerIndex !== -1 ) {
			// Case A: Step container was inserted.
			const beforeBlocks = blocksWithoutButton.slice( 0, containerIndex );
			const afterBlocks = blocksWithoutButton.slice( containerIndex + 1 );
			const existingStepContainer = blocksWithoutButton[ containerIndex ];

			// Use existing steps if available, otherwise create new ones
			if ( existingStepContainer.innerBlocks && existingStepContainer.innerBlocks.length > 0 ) {
				stepBlocks = existingStepContainer.innerBlocks;
			} else {
				// Create steps from blocks before and after the container
				if ( beforeBlocks.length > 0 ) {
					stepBlocks.push( createBlock( 'jetpack/form-step', {}, beforeBlocks ) );
				}
				if ( afterBlocks.length > 0 ) {
					stepBlocks.push( createBlock( 'jetpack/form-step', {}, afterBlocks ) );
				}
				if ( stepBlocks.length === 0 ) {
					stepBlocks.push( createBlock( 'jetpack/form-step', {}, [] ) );
				}
			}
		} else {
			// Case B: Has form-step block but no container
			const stepIndex = blocksWithoutButton.findIndex(
				block => block.name === 'jetpack/form-step'
			);

			if ( stepIndex !== -1 ) {
				const beforeBlocks = blocksWithoutButton.slice( 0, stepIndex );
				const afterBlocks = blocksWithoutButton.slice( stepIndex + 1 );

				if ( beforeBlocks.length > 0 ) {
					stepBlocks.push( createBlock( 'jetpack/form-step', {}, beforeBlocks ) );
				}

				stepBlocks.push( blocksWithoutButton[ stepIndex ] );

				if ( afterBlocks.length > 0 ) {
					stepBlocks.push( createBlock( 'jetpack/form-step', {}, afterBlocks ) );
				}
			}
			// Case C: No step blocks or containers — build steps based on divider markers.
			else if ( blocksWithoutButton.length > 0 ) {
				const hasDivider = blocksWithoutButton.some( b => b.name === 'jetpack/form-step-divider' );

				if ( hasDivider ) {
					// Split by divider markers into groups
					const groups = [];
					let currentGroup = [];

					blocksWithoutButton.forEach( block => {
						if ( block.name === 'jetpack/form-step-divider' ) {
							// Commit current group (even empty to respect explicit divider)
							groups.push( currentGroup );
							currentGroup = [];
						} else {
							currentGroup.push( block );
						}
					} );

					// Add the trailing group
					groups.push( currentGroup );

					stepBlocks = groups.map( inner => createBlock( 'jetpack/form-step', {}, inner ) );
				} else {
					// Fallback: one step per top-level block
					stepBlocks = blocksWithoutButton.map( block =>
						createBlock( 'jetpack/form-step', {}, [ block ] )
					);
				}

				// Ensure at least one step exists
				if ( stepBlocks.length === 0 ) {
					stepBlocks = [ createBlock( 'jetpack/form-step', {}, [] ) ];
				}
			} else {
				stepBlocks = [ createBlock( 'jetpack/form-step', {}, [] ) ];
			}
		}

		// Create the step container with the step blocks
		const stepContainer = createBlock( 'jetpack/form-step-container', {}, stepBlocks );

		// 4. Prepare all components for the final form
		const preparedButton = prepareSubmitButton( buttonBlock );
		const stepNavigation = createStepNavigation( preparedButton );
		const progressIndicator = getProgressIndicator();

		// 5. Replace all inner blocks with our structured form (no extra undo level),
		//    then flip the variation which *does* create the single desired snapshot.
		__unstableMarkNextChangeAsNotPersistent();
		replaceInnerBlocks( clientId, [ progressIndicator, stepContainer, stepNavigation ], false );

		// Ensure we are marked as multistep – this records the undo level.
		if ( variationName !== 'multistep' ) {
			setAttributes( { variationName: 'multistep' } );
		}
		formTransitionStateRef.current = FormTransitionState.IS_MULTISTEP;
	}, [
		variationName,
		currentInnerBlocks,
		clientId,
		replaceInnerBlocks,
		setAttributes,
		containsMultistepBlock,
		__unstableMarkNextChangeAsNotPersistent,
	] );

	/*───────────────────────────────────────────────────────────────────────────
	 * Flatten multistep structure → standard form
	 *───────────────────────────────────────────────────────────────────────*/
	useEffect( () => {
		// Early exit if we are still on the multistep variation or if there are
		// no multistep-specific blocks to clean up.
		if ( FormTransitionState.TO_FORM !== formTransitionStateRef.current ) {
			return;
		}

		// Will hold a reference to the submit button that should remain after cleanup.
		let finalSubmitButton = null;

		// Flatten helper – collects blocks that should remain in the standard form.
		const flattenBlocks = blocks => {
			let flat = [];

			blocks.forEach( block => {
				if ( block.name === 'jetpack/form-step-container' ) {
					// Extract inner content of each step.
					block.innerBlocks.forEach( step => {
						if ( step.name === 'jetpack/form-step' ) {
							flat = flat.concat( step.innerBlocks );
						}
					} );
					return;
				}

				if ( block.name === 'jetpack/form-step' ) {
					flat = flat.concat( block.innerBlocks );
					return;
				}

				if (
					block.name === 'jetpack/form-step-navigation' ||
					block.name === 'jetpack/form-progress-indicator' ||
					block.name === 'jetpack/form-step-divider'
				) {
					// Capture submit button (if any) inside navigation but skip the wrapper.
					if ( ! finalSubmitButton ) {
						finalSubmitButton = block.innerBlocks?.find(
							inner =>
								inner.name === 'jetpack/button' && inner.attributes?.customVariant === 'submit'
						);
					}
					return; // Omit multistep-specific blocks.
				}

				// For any other block, keep as-is.
				flat.push( block );
			} );

			return flat;
		};

		const flattenedInnerBlocks = flattenBlocks( currentInnerBlocks );

		// Ensure we have a submit button at the end of the form.
		if ( ! finalSubmitButton ) {
			// Create a fresh submit button if none was found.
			finalSubmitButton = createBlock( 'jetpack/button', {
				element: 'button',
				text: __( 'Submit', 'jetpack-forms' ),
			} );
		}

		const finalBlocks = [ ...flattenedInnerBlocks, finalSubmitButton ];

		__unstableMarkNextChangeAsNotPersistent();
		replaceInnerBlocks( clientId, finalBlocks, false );
		// Reset the variation attribute if still set to something else.
		if ( variationName !== 'default-empty' ) {
			__unstableMarkNextChangeAsNotPersistent();
			setAttributes( { variationName: 'default-empty' } );
		}

		formTransitionStateRef.current = FormTransitionState.IS_FORM;
	}, [
		variationName,
		currentInnerBlocks,
		containsMultistepBlock,
		clientId,
		replaceInnerBlocks,
		__unstableMarkNextChangeAsNotPersistent,
		setAttributes,
	] );

	const { setActiveStep } = useDispatch( singleStepStore );

	// Find the selected block and its parent step block
	const selectedBlock = useFindBlockRecursively(
		selectedBlockClientId,
		block => block.clientId === selectedBlockClientId
	);
	const stepBlock = useFindBlockRecursively(
		selectedBlock?.clientId || '',
		block => block.name === 'jetpack/form-step'
	);

	useEffect( () => {
		if ( ! isSingleStep ) {
			return;
		}

		// If a block is selected, make sure it's in the current step
		if ( selectedBlockClientId && stepBlock && stepBlock.clientId !== currentStepClientId ) {
			setActiveStep( clientId, stepBlock.clientId );
		}
	}, [
		selectedBlockClientId,
		clientId,
		steps,
		setActiveStep,
		isSingleStep,
		currentStepClientId,
		stepBlock,
	] );

	let elt;

	if ( ! isModuleActive ) {
		if ( isLoadingModules ) {
			elt = <ContactFormSkeletonLoader />;
		} else {
			elt = (
				<ContactFormPlaceholder
					changeStatus={ changeStatus }
					isModuleActive={ isModuleActive }
					isLoading={ isChangingStatus }
				/>
			);
		}
	} else if ( ! hasAnyInnerBlocks ) {
		elt = (
			<VariationPicker
				blockName={ name }
				setAttributes={ setAttributes }
				clientId={ clientId }
				classNames={ formClassnames }
			/>
		);
	} else if ( onlySubmitBlock ) {
		elt = (
			<>
				<div className="is-form-empty">
					<InnerBlocks.ButtonBlockAppender />
				</div>
				<div { ...innerBlocksProps } />
			</>
		);
	} else {
		elt = (
			<>
				<BlockControls>
					{ variationName === 'multistep' && <StepControls formClientId={ clientId } /> }
				</BlockControls>
				<InspectorControls>
					<PanelBody
						title={ __( 'Action after submit', 'jetpack-forms' ) }
						initialOpen={ false }
						className="jetpack-contact-form__panel"
					>
						<RadioControl
							label={ __( 'Confirmation type', 'jetpack-forms' ) }
							selected={ confirmationType }
							options={ [
								{ label: __( 'Text', 'jetpack-forms' ), value: 'text' },
								{ label: __( 'Redirect link', 'jetpack-forms' ), value: 'redirect' },
							] }
							onChange={ ( newValue: 'text' | 'redirect' ) =>
								setAttributes( { confirmationType: newValue } )
							}
						/>

						{ 'text' === confirmationType && (
							<>
								<TextControl
									label={ __( 'Message heading', 'jetpack-forms' ) }
									value={ customThankyouHeading }
									placeholder={ __( 'Your message has been sent', 'jetpack-forms' ) }
									onChange={ ( newHeading: string ) =>
										setAttributes( { customThankyouHeading: newHeading } )
									}
									__nextHasNoMarginBottom={ true }
									__next40pxDefaultSize={ true }
								/>

								<TextareaControl
									label={ __( 'Message text', 'jetpack-forms' ) }
									value={ customThankyouMessage }
									placeholder={ __( 'Thank you for your submission!', 'jetpack-forms' ) }
									onChange={ ( newMessage: string ) =>
										setAttributes( { customThankyouMessage: newMessage } )
									}
									__nextHasNoMarginBottom={ true }
								/>

								<ToggleControl
									label={ __( 'Show summary', 'jetpack-forms' ) }
									checked={ ! disableSummary }
									onChange={ ( newDisableSummary: boolean ) =>
										setAttributes( { disableSummary: ! newDisableSummary } )
									}
									__nextHasNoMarginBottom={ true }
									__next40pxDefaultSize={ true }
								/>

								<ToggleControl
									label={ __( 'Show "Go back" link', 'jetpack-forms' ) }
									checked={ ! disableGoBack }
									onChange={ ( newDisableGoBack: boolean ) =>
										setAttributes( { disableGoBack: ! newDisableGoBack } )
									}
									__nextHasNoMarginBottom={ true }
									__next40pxDefaultSize={ true }
								/>
							</>
						) }

						{ 'redirect' === confirmationType && (
							<div>
								<URLInput
									label={ __( 'Redirect address', 'jetpack-forms' ) }
									value={ customThankyouRedirect }
									className="jetpack-contact-form__thankyou-redirect-url"
									onChange={ ( newURL: string ) =>
										setAttributes( { customThankyouRedirect: newURL } )
									}
								/>
							</div>
						) }
					</PanelBody>
					<PanelBody
						title={ __( 'Form notifications', 'jetpack-forms' ) }
						initialOpen={ false }
						className="jetpack-contact-form__panel"
					>
						<NotificationsSettings
							notificationRecipients={ notificationRecipients }
							emailAddress={ to }
							emailSubject={ subject }
							emailNotifications={ emailNotifications }
							instanceId={ instanceId }
							postAuthorEmail={ postAuthorEmail }
							setAttributes={ setAttributes }
						/>
					</PanelBody>
					{ showFormIntegrations && (
						<Suspense fallback={ <div /> }>
							<IntegrationControls attributes={ attributes } setAttributes={ setAttributes } />
						</Suspense>
					) }
					<PanelBody
						title={ __( 'Responses storage', 'jetpack-forms' ) }
						className="jetpack-contact-form__panel jetpack-contact-form__responses-storage-panel"
						initialOpen={ false }
					>
						<JetpackManageResponsesSettings
							attributes={ attributes }
							setAttributes={ setAttributes }
						/>
					</PanelBody>
				</InspectorControls>
				<InspectorAdvancedControls>
					<TextControl
						label={ __( 'Accessible name', 'jetpack-forms' ) }
						value={ formTitle }
						placeholder={ postTitle }
						onChange={ value => setAttributes( { formTitle: value } ) }
						help={ __(
							'Add an accessible name to help people using assistive technology identify the form. Defaults to page or post title.',
							'jetpack-forms'
						) }
						__nextHasNoMarginBottom={ true }
						__next40pxDefaultSize={ true }
					/>
					<ExternalLink href="https://developer.mozilla.org/docs/Glossary/Accessible_name">
						{ __( 'Read more.', 'jetpack-forms' ) }
					</ExternalLink>
				</InspectorAdvancedControls>
				<BlockContextProvider
					value={ {
						'jetpack/form-steps': steps,
						'jetpack/form-current-step': currentStepInfo,
					} }
				>
					<div { ...innerBlocksProps } />
				</BlockContextProvider>
			</>
		);
	}

	return (
		<SyncedAttributeProvider>
			<ThemeProvider targetDom={ wrapperRef.current }>
				<div { ...blockProps }>{ elt }</div>
			</ThemeProvider>
		</SyncedAttributeProvider>
	);
}

export default JetpackContactFormEdit;
