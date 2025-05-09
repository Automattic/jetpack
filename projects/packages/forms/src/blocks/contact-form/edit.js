import { ThemeProvider } from '@automattic/jetpack-components';
import { isSimpleSite, useModuleStatus } from '@automattic/jetpack-shared-extension-utils';
import {
	InspectorAdvancedControls,
	InspectorControls,
	URLInput,
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
	Notice,
} from '@wordpress/components';
import { useInstanceId } from '@wordpress/compose';
import { store as coreStore } from '@wordpress/core-data';
import { useSelect, useDispatch } from '@wordpress/data';
import { store as editorStore } from '@wordpress/editor';
import { useRef, useEffect } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import clsx from 'clsx';
import { filter, isArray, map } from 'lodash';
import { childBlocks } from './child-blocks';
import InspectorHint from './components/inspector-hint';
import { ContactFormPlaceholder } from './components/jetpack-contact-form-placeholder';
import ContactFormSkeletonLoader from './components/jetpack-contact-form-skeleton-loader';
import JetpackEmailConnectionSettings from './components/jetpack-email-connection-settings';
import IntegrationControls from './components/jetpack-integration-controls';
import JetpackManageResponsesSettings from './components/jetpack-manage-responses-settings';
import StepControls from './components/step-controls';
import VariationPicker from './variation-picker';
import './util/form-styles.js';

const ALL_STEPS_VALUE = '__all__';

const validFields = filter( childBlocks, ( { settings } ) => {
	return (
		! settings.parent ||
		settings.parent === 'jetpack/contact-form' ||
		( isArray( settings.parent ) && settings.parent.includes( 'jetpack/contact-form' ) )
	);
} );

const ALLOWED_BLOCKS = [
	...map( validFields, block => `jetpack/${ block.name }` ),
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
		selectedStepClientId = ALL_STEPS_VALUE,
		variationName,
		stepTransition = 'fade-slide',
	} = attributes;
	const instanceId = useInstanceId( JetpackContactFormEdit );
	const {
		postTitle,
		canUserInstallPlugins,
		hasAnyInnerBlocks,
		postAuthorEmail,
		hasStepBlock,
		isEveryBlockStep,
		selectedBlockClientId,
		isFirstStep,
		isLastStep,
		innerBlocks,
	} = useSelect(
		select => {
			const { getBlocks, getSelectedBlockClientId } = select( blockEditorStore );
			const { getEditedPostAttribute } = select( editorStore );
			const { getUser, canUser } = select( coreStore );
			const innerBlocksData = getBlocks( clientId );

			const title = getEditedPostAttribute( 'title' );
			const authorId = getEditedPostAttribute( 'author' );
			const authorEmail = authorId && getUser( authorId )?.email;
			const stepBlocks = innerBlocksData.filter( block => block.name === 'jetpack/form-step' );
			const submitButton = innerBlocksData.find( block => block.name === 'jetpack/button' );
			const isEveryChildBlockStep = innerBlocksData.every(
				block =>
					block.name === 'jetpack/form-step' ||
					block.name === 'jetpack/form-step-navigation' ||
					block.name === 'jetpack/form-progress-indicator' ||
					block.name === 'core/paragraph'
			);
			if ( submitButton && ! submitButton.attributes.lock ) {
				const lock = { move: false, remove: true };
				submitButton.attributes.lock = lock;
			}

			return {
				postTitle: title,
				canUserInstallPlugins: canUser( 'create', 'plugins' ),
				hasAnyInnerBlocks: innerBlocksData.length > 0,
				postAuthorEmail: authorEmail,
				hasStepBlock: !! stepBlocks.length,
				isEveryBlockStep: isEveryChildBlockStep,
				selectedBlockClientId: getSelectedBlockClientId(),
				isFirstStep: stepBlocks[ 0 ]?.clientId === selectedStepClientId,
				isLastStep: stepBlocks[ stepBlocks.length - 1 ]?.clientId === selectedStepClientId,
				innerBlocks: innerBlocksData,
			};
		},
		[ clientId, selectedStepClientId ]
	);

	const { replaceInnerBlocks } = useDispatch( blockEditorStore );

	const wrapperRef = useRef();
	const innerRef = useRef();
	const blockProps = useBlockProps( { ref: wrapperRef } );
	const formClassnames = clsx(
		className,
		'jetpack-contact-form',
		isFirstStep && 'is-first-step',
		isLastStep && 'is-last-step',
		hasStepBlock && selectedBlockClientId !== ALL_STEPS_VALUE && 'is-previewing-step'
	);
	const innerBlocksProps = useInnerBlocksProps(
		{
			ref: innerRef,
			className: formClassnames,
			style: window.jetpackForms.generateStyleVariables( innerRef.current ),
		},
		{
			allowedBlocks: hasStepBlock
				? [
						'jetpack/form-step',
						'jetpack/form-step-navigation',
						'jetpack/form-progress-indicator',
						'core/paragraph',
				  ]
				: ALLOWED_BLOCKS,
			prioritizedInserterBlocks: PRIORITIZED_INSERTER_BLOCKS,
			templateInsertUpdatesSelection: false,
		}
	);
	const { isLoadingModules, isChangingStatus, isModuleActive, changeStatus } =
		useModuleStatus( 'contact-form' );

	const hasStructured = useRef( false );

	useEffect( () => {
		if ( hasStructured.current ) {
			return;
		}

		const stepBlocks = innerBlocks.filter( block => block.name === 'jetpack/form-step' );
		const stepBlockCount = stepBlocks.length;

		if ( stepBlockCount === 0 ) {
			return;
		}

		if ( stepBlockCount > 1 ) {
			hasStructured.current = true;
			return;
		}

		if ( isEveryBlockStep ) {
			hasStructured.current = true;
			return;
		}

		const firstStepBlock = stepBlocks[ 0 ];
		const firstStepBlockIndex = innerBlocks.findIndex(
			block => block.clientId === firstStepBlock.clientId
		);

		const fieldsBefore = innerBlocks
			.slice( 0, firstStepBlockIndex )
			.filter( block => block.name !== 'jetpack/button' );

		const fieldsAfter = innerBlocks
			.slice( firstStepBlockIndex + 1 )
			.filter(
				block =>
					block.name !== 'jetpack/button' &&
					block.name !== 'jetpack/form-step' &&
					block.name !== 'jetpack/form-step-navigation'
			);

		const finalBlocks = [];

		if ( fieldsBefore.length > 0 ) {
			finalBlocks.push(
				createBlock( 'jetpack/form-step', {}, [
					...fieldsBefore,
					createBlock( 'jetpack/form-step-navigation' ),
				] )
			);
		}

		finalBlocks.push( firstStepBlock );

		if ( fieldsAfter.length > 0 ) {
			finalBlocks.push(
				createBlock( 'jetpack/form-step', {}, [
					...fieldsAfter,
					createBlock( 'jetpack/form-step-navigation' ),
				] )
			);
		}

		// Add progress indicator at the beginning of the form
		finalBlocks.unshift( createBlock( 'jetpack/form-progress-indicator' ) );

		replaceInnerBlocks( clientId, finalBlocks );
		hasStructured.current = true;
	}, [ innerBlocks, clientId, replaceInnerBlocks, isEveryBlockStep ] );

	useEffect( () => {
		if ( variationName === 'multistep' ) {
			return;
		}

		if ( hasStepBlock ) {
			setAttributes( { variationName: 'multistep' } );
		} else {
			setAttributes( { variationName: 'default' } );
		}
	}, [ hasStepBlock, variationName, setAttributes ] );

	const prevSelectedBlockClientIdRef = useRef();

	// Effect to sync List View selection with StepControls (if not in 'All Steps')
	useEffect( () => {
		const prevSelectedBlockClientId = prevSelectedBlockClientIdRef.current;
		// console.log('[ContactForm Edit Effect] Running. selectedBlockClientId:', selectedBlockClientId, 'prev:', prevSelectedBlockClientId, 'selectedStepClientId:', selectedStepClientId); // LOGGING

		// Only proceed if the selected block changed *and* it's not null/undefined
		if ( selectedBlockClientId && selectedBlockClientId !== prevSelectedBlockClientId ) {
			// console.log('[ContactForm Edit Effect] Selected block changed.'); // LOGGING
			// Ensure we are NOT in 'All Steps' mode before syncing
			if ( selectedStepClientId !== ALL_STEPS_VALUE && innerBlocks ) {
				// console.log('[ContactForm Edit Effect] Not in All Steps mode.'); // LOGGING
				// Check if the newly selected block is one of our direct step children
				const isSelectedBlockOurStep = innerBlocks.some(
					block => block.name === 'jetpack/form-step' && block.clientId === selectedBlockClientId
				);
				// console.log('[ContactForm Edit Effect] isSelectedBlockOurStep:', isSelectedBlockOurStep); // LOGGING

				// If a step child is selected via List View and it's not already the active step in the dropdown
				if ( isSelectedBlockOurStep && selectedBlockClientId !== selectedStepClientId ) {
					// console.log('[ContactForm Edit Effect] Setting selectedStepClientId to:', selectedBlockClientId); // LOGGING
					setAttributes( { selectedStepClientId: selectedBlockClientId } );
				}
			}
		}
		// Update the ref *after* the logic check for the next render
		prevSelectedBlockClientIdRef.current = selectedBlockClientId;

		// Keep dependencies, but logic now filters based on actual selectedBlockClientId changes
	}, [ selectedBlockClientId, selectedStepClientId, innerBlocks, setAttributes ] );

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
					{ hasStepBlock && (
						<StepControls
							clientId={ clientId }
							selectedStepClientId={ selectedStepClientId }
							setParentAttributes={ setAttributes }
							stepTransition={ stepTransition }
						/>
					) }
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
							label={ __( 'On Submission', 'jetpack-forms' ) }
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
								label={ __( 'Message Heading', 'jetpack-forms' ) }
								value={ customThankyouHeading }
								placeholder={ __( 'Your message has been sent', 'jetpack-forms' ) }
								onChange={ newHeading => setAttributes( { customThankyouHeading: newHeading } ) }
								__nextHasNoMarginBottom={ true }
								__next40pxDefaultSize={ true }
							/>
						) }

						{ 'message' === customThankyou && (
							<TextareaControl
								label={ __( 'Message Text', 'jetpack-forms' ) }
								value={ customThankyouMessage }
								placeholder={ __( 'Thank you for your submission!', 'jetpack-forms' ) }
								onChange={ newMessage => setAttributes( { customThankyouMessage: newMessage } ) }
								__nextHasNoMarginBottom={ true }
							/>
						) }

						{ 'redirect' === customThankyou && (
							<div>
								<URLInput
									label={ __( 'Redirect Address', 'jetpack-forms' ) }
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
				{ hasStepBlock && ! isEveryBlockStep && (
					<Notice status="warning" isDismissible={ false }>
						{ __(
							'This form contains steps. You can add fields to each step, but you cannot add fields outside of the steps.',
							'jetpack-forms'
						) }
					</Notice>
				) }
				<div { ...innerBlocksProps } />
			</>
		);
	}

	return (
		<ThemeProvider targetDom={ wrapperRef.current }>
			<div { ...blockProps }>{ elt }</div>
		</ThemeProvider>
	);
}

export default JetpackContactFormEdit;
