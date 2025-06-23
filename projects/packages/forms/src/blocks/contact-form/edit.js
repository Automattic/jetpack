import { ThemeProvider } from '@automattic/jetpack-components';
import { isSimpleSite } from '@automattic/jetpack-script-data';
import { useModuleStatus } from '@automattic/jetpack-shared-extension-utils';
import {
	URLInput,
	InspectorAdvancedControls,
	InspectorControls,
	useBlockProps,
	useInnerBlocksProps,
	store as blockEditorStore,
	BlockControls,
} from '@wordpress/block-editor';
import { createBlock } from '@wordpress/blocks';
import {
	ExternalLink,
	PanelBody,
	SelectControl,
	TextareaControl,
	TextControl,
} from '@wordpress/components';
import { useInstanceId } from '@wordpress/compose';
import { store as coreStore } from '@wordpress/core-data';
import { useSelect, useDispatch } from '@wordpress/data';
import { store as editorStore } from '@wordpress/editor';
import { useRef, useEffect, useCallback } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import clsx from 'clsx';
import { filter, isArray, map } from 'lodash';
import { store as singleStepStore } from '../../store/form-step-preview';
import {
	PREVIOUS_BUTTON_TEMPLATE,
	NEXT_BUTTON_TEMPLATE,
	NAVIGATION_TEMPLATE,
} from '../form-step-navigation/edit';
import StepControls from '../shared/components/form-step-controls';
import InspectorHint from '../shared/components/inspector-hint';
import JetpackManageResponsesSettings from '../shared/components/jetpack-manage-responses-settings';
import { useFindBlockRecursively } from '../shared/hooks/use-find-block-recursively';
import useFormSteps from '../shared/hooks/use-form-steps';
import { SyncedAttributeProvider } from '../shared/hooks/use-synced-attributes';
import { childBlocks } from './child-blocks';
import { ContactFormPlaceholder } from './components/jetpack-contact-form-placeholder';
import ContactFormSkeletonLoader from './components/jetpack-contact-form-skeleton-loader';
import JetpackEmailConnectionSettings from './components/jetpack-email-connection-settings';
import IntegrationControls from './components/jetpack-integration-controls';
import VariationPicker from './variation-picker';
import './util/form-styles.js';

const validFields = filter( childBlocks, ( { settings } ) => {
	return (
		! settings.parent ||
		settings.parent === 'jetpack/contact-form' ||
		( isArray( settings.parent ) && settings.parent.includes( 'jetpack/contact-form' ) )
	);
} );

const ALLOWED_BLOCKS = [ ...map( validFields, block => `jetpack/${ block.name }` ) ];

const ALLOWED_CORE_BLOCKS = [
	'core/audio',
	'core/columns',
	'core/group',
	'core/heading',
	'core/html',
	'core/image',
	'core/list',
	'core/paragraph',
	'core/row',
	'core/separator',
	'core/spacer',
	'core/stack',
	'core/subhead',
	'core/video',
];

// At the top level of a multistep form we allow navigation, progress indicator
// and the step-container itself (users may add it manually before steps are
// auto-structured). The core block list remains unchanged.
const ALLOWED_MULTI_STEP_BLOCKS = [
	'jetpack/form-step-navigation',
	'jetpack/form-progress-indicator',
	'jetpack/form-step-container',
	'jetpack/form-step-divider',
].concat( ALLOWED_CORE_BLOCKS );

const ALLOWED_FORM_BLOCKS = ALLOWED_BLOCKS.concat( [
	'jetpack/form-step-divider',
	'jetpack/form-step-container',
] ).concat( ALLOWED_CORE_BLOCKS );

const PRIORITIZED_INSERTER_BLOCKS = [ ...map( validFields, block => `jetpack/${ block.name }` ) ];

function JetpackContactFormEdit( { name, attributes, setAttributes, clientId, className } ) {
	const {
		to,
		subject,
		customThankyou,
		customThankyouHeading,
		customThankyouMessage,
		customThankyouRedirect,
		formTitle,
		variationName,
	} = attributes;
	const instanceId = useInstanceId( JetpackContactFormEdit );

	const steps = useFormSteps( clientId );

	const submitButton = useFindBlockRecursively(
		clientId,
		block => block.name === 'jetpack/button'
	);

	const {
		postTitle,
		canUserInstallPlugins,
		hasAnyInnerBlocks,
		postAuthorEmail,
		selectedBlockClientId,
	} = useSelect(
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

			const { getUser, canUser } = select( coreStore );
			const innerBlocksData = getBlocks( clientId );

			const title = getEditedPostAttribute( 'title' );
			const authorId = getEditedPostAttribute( 'author' );
			const authorEmail = authorId && getUser( authorId )?.email;

			return {
				postTitle: title,
				canUserInstallPlugins: canUser( 'create', 'plugins' ),
				hasAnyInnerBlocks: innerBlocksData.length > 0,
				postAuthorEmail: authorEmail,
				selectedBlockClientId: selectedStepBlockId,
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

	const { replaceInnerBlocks, __unstableMarkNextChangeAsNotPersistent } =
		useDispatch( blockEditorStore );

	const currentInnerBlocks = useSelect(
		select => select( blockEditorStore ).getBlocks( clientId ),
		[ clientId ]
	);

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
	const hasStructuredRef = useRef( false );

	useEffect( () => {
		/*───────────────────────────────────────────────────────────────────────────
		 * 1. Early-exit guards
		 *───────────────────────────────────────────────────────────────────────────
		 * – The `variationName` gate ensures we only run this effect when the form
		 *   actually *is* (or has just become) a multistep form. If the user is
		 *   working with a regular single-step form we leave everything untouched.
		 * – `hasStructuredRef` prevents the body from executing more than once per
		 *   block instance (avoids extra undo levels and wasted processing).
		 *
		 *───────────────────────────────────────────────────────────────────────────
		 * 2. Detect whether the form is *already* correctly structured
		 *───────────────────────────────────────────────────────────────────────────
		 * Strategy:
		 *   • If there is exactly ONE `step-container` anywhere in the tree **and**
		 *   • There are NO `form-step` blocks that live outside that container,
		 *     we assume the layout came from the Variation Picker (or has already
		 *     been normalised) and we skip the heavy restructuring.
		 */
		const needsMultistep =
			variationName === 'multistep' || containsMultistepBlock( currentInnerBlocks );

		if ( ! needsMultistep || hasStructuredRef.current ) {
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
			hasStructuredRef.current = true;
			return;
		}

		// Mark that we'll process the conversion now so we don't repeat it.
		hasStructuredRef.current = true;

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
	}, [
		variationName,
		currentInnerBlocks,
		clientId,
		replaceInnerBlocks,
		setAttributes,
		containsMultistepBlock,
		__unstableMarkNextChangeAsNotPersistent,
	] );

	// --- Reset logic -----------------------------------------------------------
	// When all multistep-specific blocks are removed, clear the structured flag so
	// that the auto-structuring effect can run again if the user later re-adds
	// multistep blocks.
	useEffect( () => {
		if ( hasStructuredRef.current && ! containsMultistepBlock( currentInnerBlocks ) ) {
			hasStructuredRef.current = false;
		}
	}, [ currentInnerBlocks, containsMultistepBlock ] );

	/*───────────────────────────────────────────────────────────────────────────
	 * Flatten multistep structure → standard form
	 *───────────────────────────────────────────────────────────────────────*/
	useEffect( () => {
		// Early exit if we are still on the multistep variation or if there are
		// no multistep-specific blocks to clean up.
		if ( variationName === 'multistep' || ! containsMultistepBlock( currentInnerBlocks ) ) {
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
			setAttributes( { variationName: 'default-empty' } );
		}

		// Allow the structuring effect to run again later if needed.
		hasStructuredRef.current = false;
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
	} else {
		elt = (
			<>
				<BlockControls>
					{ variationName === 'multistep' && <StepControls formClientId={ clientId } /> }
				</BlockControls>
				<InspectorControls>
					<PanelBody
						title={ __( 'Manage responses', 'jetpack-forms' ) }
						className="jetpack-contact-form__manage-responses-panel"
						initialOpen={ false }
					>
						<JetpackManageResponsesSettings setAttributes={ setAttributes } />
					</PanelBody>
					<PanelBody title={ __( 'Action after submit', 'jetpack-forms' ) } initialOpen={ false }>
						<InspectorHint>
							{ __( 'Customize the view after form submission:', 'jetpack-forms' ) }
						</InspectorHint>
						<SelectControl
							label={ __( 'On submission', 'jetpack-forms' ) }
							value={ customThankyou }
							options={ [
								{ label: __( 'Show a summary of submitted fields', 'jetpack-forms' ), value: '' },
								{ label: __( 'Show a custom text message', 'jetpack-forms' ), value: 'message' },
								{
									label: __( 'Redirect to another webpage', 'jetpack-forms' ),
									value: 'redirect',
								},
							] }
							onChange={ newMessage => setAttributes( { customThankyou: newMessage } ) }
							__nextHasNoMarginBottom={ true }
							__next40pxDefaultSize={ true }
						/>

						{ 'redirect' !== customThankyou && (
							<TextControl
								label={ __( 'Message heading', 'jetpack-forms' ) }
								value={ customThankyouHeading }
								placeholder={ __( 'Your message has been sent', 'jetpack-forms' ) }
								onChange={ newHeading => setAttributes( { customThankyouHeading: newHeading } ) }
								__nextHasNoMarginBottom={ true }
								__next40pxDefaultSize={ true }
							/>
						) }

						{ 'message' === customThankyou && (
							<TextareaControl
								label={ __( 'Message text', 'jetpack-forms' ) }
								value={ customThankyouMessage }
								placeholder={ __( 'Thank you for your submission!', 'jetpack-forms' ) }
								onChange={ newMessage => setAttributes( { customThankyouMessage: newMessage } ) }
								__nextHasNoMarginBottom={ true }
							/>
						) }

						{ 'redirect' === customThankyou && (
							<div>
								<URLInput
									label={ __( 'Redirect address', 'jetpack-forms' ) }
									value={ customThankyouRedirect }
									className="jetpack-contact-form__thankyou-redirect-url"
									onChange={ newURL => setAttributes( { customThankyouRedirect: newURL } ) }
								/>
							</div>
						) }
					</PanelBody>
					<PanelBody title={ __( 'Email connection', 'jetpack-forms' ) } initialOpen={ false }>
						<JetpackEmailConnectionSettings
							emailAddress={ to }
							emailSubject={ subject }
							instanceId={ instanceId }
							postAuthorEmail={ postAuthorEmail }
							setAttributes={ setAttributes }
						/>
					</PanelBody>

					{ ! isSimpleSite() && canUserInstallPlugins && (
						<IntegrationControls attributes={ attributes } setAttributes={ setAttributes } />
					) }
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
				<div { ...innerBlocksProps } />
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
