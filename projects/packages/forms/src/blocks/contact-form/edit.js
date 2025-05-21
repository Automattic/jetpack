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
} from '@wordpress/components';
import { useInstanceId } from '@wordpress/compose';
import { store as coreStore } from '@wordpress/core-data';
import { useSelect, useDispatch } from '@wordpress/data';
import { store as editorStore } from '@wordpress/editor';
import { useRef, useEffect } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import clsx from 'clsx';
import { filter, isArray, map } from 'lodash';
import { useFindBlockRecursively } from '../../hooks/use-find-block-recursively';
import useFormSteps from '../../hooks/use-form-steps';
import { store as previewStore } from '../../store/preview-store';
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

	const stepContainerInForm = useFindBlockRecursively(
		clientId,
		block => block.name === 'jetpack/step-container'
	);
	const isConfiguredForSteps = !! stepContainerInForm;

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
			const { getBlocks, getSelectedBlockClientId } = select( blockEditorStore );
			const { getEditedPostAttribute } = select( editorStore );
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
				selectedBlockClientId: getSelectedBlockClientId(),
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

	const { currentStepInfo, isPreview } = useSelect(
		select => {
			const { getCurrentStepInfo, isPreviewMode } = select( previewStore );
			return {
				currentStepInfo: getCurrentStepInfo( clientId, steps ),
				isPreview: isPreviewMode( clientId ),
			};
		},
		[ clientId, steps ]
	);

	const { isFirstStep, isLastStep } = currentStepInfo || { isFirstStep: false, isLastStep: false };

	const wrapperRef = useRef();
	const innerRef = useRef();
	const blockProps = useBlockProps( { ref: wrapperRef } );
	const formClassnames = clsx(
		className,
		'jetpack-contact-form',
		isFirstStep && 'is-first-step',
		isLastStep && 'is-last-step',
		isConfiguredForSteps && isPreview && 'is-previewing-step'
	);

	const innerBlocksProps = useInnerBlocksProps(
		{
			ref: innerRef,
			className: formClassnames,
			style: window.jetpackForms.generateStyleVariables( innerRef.current ),
		},
		{
			allowedBlocks: isConfiguredForSteps ? ALLOWED_MULTI_STEP_BLOCKS : ALLOWED_FORM_BLOCKS,
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

	const hasStepContainer = isConfiguredForSteps;

	useEffect( () => {
		if ( variationName === 'multistep' ) {
			if ( ! hasStepContainer && currentInnerBlocks.length > 0 ) {
				const blocksToWrap = currentInnerBlocks.filter(
					block =>
						block.name !== 'jetpack/step-container' &&
						block.name !== 'jetpack/form-step' &&
						block.name !== 'jetpack/form-progress-indicator' &&
						block.name !== 'jetpack/form-step-navigation'
				);

				const newFormStepNavigation = createBlock( 'jetpack/form-step-navigation', {} );
				const newFormStep = createBlock(
					'jetpack/form-step',
					{ title: __( 'Step 1', 'jetpack-forms' ) },
					[ ...blocksToWrap, newFormStepNavigation ]
				);

				const newStepContainer = createBlock( 'jetpack/step-container', {}, [ newFormStep ] );

				const newProgressIndicator = createBlock( 'jetpack/form-progress-indicator', {} );

				replaceInnerBlocks( clientId, [ newProgressIndicator, newStepContainer ] );
			} else if (
				! hasStepContainer &&
				currentInnerBlocks.length === 0 &&
				name === 'jetpack/contact-form'
			) {
				const defaultProgressIndicator = createBlock( 'jetpack/form-progress-indicator', {
					labels: [ __( 'Step 1', 'jetpack-forms' ) ],
					activeStep: 0,
					showLabels: true,
				} );
				const defaultFormStepNavigation = createBlock( 'jetpack/form-step-navigation', {} );
				const defaultFormStep = createBlock(
					'jetpack/form-step',
					{ title: __( 'Step 1', 'jetpack-forms' ) },
					[ defaultFormStepNavigation ]
				);
				const defaultStepContainer = createBlock( 'jetpack/step-container', {}, [
					defaultFormStep,
				] );

				replaceInnerBlocks( clientId, [ defaultProgressIndicator, defaultStepContainer ] );
			}
		} else if ( hasStepContainer ) {
			setAttributes( { variationName: 'multistep' } );
		}
	}, [
		variationName,
		currentInnerBlocks,
		clientId,
		replaceInnerBlocks,
		setAttributes,
		name,
		hasStepContainer,
	] );

	const { setPreviewStep } = useDispatch( previewStore );

	useEffect( () => {
		if ( ! isPreview ) {
			return;
		}
		if ( selectedBlockClientId && selectedBlockClientId !== clientId ) {
			const isCurrentBlockAStep = steps.some( step => step.clientId === selectedBlockClientId );
			if ( isCurrentBlockAStep ) {
				setPreviewStep( clientId, selectedBlockClientId );
			}
		}
	}, [ selectedBlockClientId, clientId, steps, setPreviewStep, isPreview ] );

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
					{ isConfiguredForSteps && <StepControls formClientId={ clientId } /> }
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
