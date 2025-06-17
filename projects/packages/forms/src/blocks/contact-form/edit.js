import { ThemeProvider } from '@automattic/jetpack-components';
import { isSimpleSite, useModuleStatus } from '@automattic/jetpack-shared-extension-utils';
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
import { useRef, useEffect } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import clsx from 'clsx';
import { filter, isArray, map } from 'lodash';
import { store as singleStepStore } from '../../store/preview-store';
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
import StepControls from './components/step-controls';
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

const ALLOWED_MULTI_STEP_BLOCKS = [
	'jetpack/form-step-navigation',
	'jetpack/form-progress-indicator',
].concat( ALLOWED_CORE_BLOCKS );

const ALLOWED_FORM_BLOCKS = ALLOWED_BLOCKS.concat( ALLOWED_CORE_BLOCKS );
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

	const formVariation = useRef( variationName );
	const initialStepContainer = useFindBlockRecursively(
		clientId,
		block => block.name === 'jetpack/step-container'
	);

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

	const { replaceInnerBlocks } = useDispatch( blockEditorStore );

	const currentInnerBlocks = useSelect(
		select => select( blockEditorStore ).getBlocks( clientId ),
		[ clientId ]
	);

	// If a user manually inserts Multistep building blocks (without using the variation
	// picker) automatically switch the form to the multistep mode. This watcher must **not**
	// run when the variation is already multistep (e.g. after picking the template), or it
	// would create an extra undo level.
	useEffect( () => {
		if ( variationName === 'multistep' ) {
			return;
		}

		if (
			currentInnerBlocks.some(
				block => block.name === 'jetpack/form-step' || block.name === 'jetpack/step-container'
			)
		) {
			setAttributes( { variationName: 'multistep' } );
		}
	}, [ variationName, currentInnerBlocks, setAttributes ] );

	// Detect a conversion to a multistep form and structure inner blocks only once.
	const hasStructuredRef = useRef( false );

	useEffect( () => {
		// Only proceed when switching to the multistep variation for the first time.
		if ( variationName !== 'multistep' || hasStructuredRef.current ) {
			return;
		}

		// Helper: deep-scan blocks for a step-container.
		const containsStepContainer = blocks =>
			blocks.some(
				b =>
					b.name === 'jetpack/step-container' ||
					( b.innerBlocks?.length && containsStepContainer( b.innerBlocks ) )
			);

		// If a Step Container block already exists we assume the template is already
		// in its correct multistep structure (e.g. inserted via the variation picker)
		// and skip any further normalisation to keep a single undo snapshot.
		const alreadyStructured = containsStepContainer( currentInnerBlocks );
		if ( alreadyStructured ) {
			hasStructuredRef.current = true;
			return;
		}

		// Mark that we've processed this conversion so we don't repeat it.
		formVariation.current = 'multistep';
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
			return createBlock( 'jetpack/form-step-navigation', {}, button ? [ button ] : [] );
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
			block => block.name === 'jetpack/step-container'
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
			// Case C: No step blocks or containers
			else if ( blocksWithoutButton.length > 0 ) {
				stepBlocks = blocksWithoutButton.map( block =>
					createBlock( 'jetpack/form-step', {}, [ block ] )
				);
			} else {
				stepBlocks = [ createBlock( 'jetpack/form-step', {}, [] ) ];
			}
		}

		// Create the step container with the step blocks
		const stepContainer = createBlock( 'jetpack/step-container', {}, stepBlocks );

		// 4. Prepare all components for the final form
		const preparedButton = prepareSubmitButton( buttonBlock );
		const stepNavigation = createStepNavigation( preparedButton );
		const progressIndicator = getProgressIndicator();

		// 5. Replace all inner blocks with our structured form
		replaceInnerBlocks( clientId, [ progressIndicator, stepContainer, stepNavigation ] );
	}, [
		variationName,
		formVariation,
		currentInnerBlocks,
		clientId,
		replaceInnerBlocks,
		setAttributes,
		name,
		initialStepContainer,
		hasStructuredRef,
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
