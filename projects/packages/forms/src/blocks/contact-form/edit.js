import { ThemeProvider } from '@automattic/jetpack-components';
import {
	getJetpackData,
	isAtomicSite,
	isSimpleSite,
	useModuleStatus,
} from '@automattic/jetpack-shared-extension-utils';
import {
	InnerBlocks,
	InspectorControls,
	URLInput,
	__experimentalBlockVariationPicker as BlockVariationPicker, // eslint-disable-line wpcalypso/no-unsafe-wp-apis
	__experimentalBlockPatternSetup as BlockPatternSetup, // eslint-disable-line wpcalypso/no-unsafe-wp-apis
} from '@wordpress/block-editor';
import { createBlock, registerBlockVariation } from '@wordpress/blocks';
import {
	BaseControl,
	Button,
	Modal,
	PanelBody,
	SelectControl,
	TextareaControl,
	TextControl,
	Notice,
} from '@wordpress/components';
import { compose, withInstanceId } from '@wordpress/compose';
import { withDispatch, withSelect } from '@wordpress/data';
import { forwardRef, Fragment, useEffect, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import clsx from 'clsx';
import { filter, get, isArray, map } from 'lodash';
import { childBlocks } from './child-blocks';
import InspectorHint from './components/inspector-hint';
import { ContactFormPlaceholder } from './components/jetpack-contact-form-placeholder';
import ContactFormSkeletonLoader from './components/jetpack-contact-form-skeleton-loader';
import CRMIntegrationSettings from './components/jetpack-crm-integration/jetpack-crm-integration-settings';
import JetpackEmailConnectionSettings from './components/jetpack-email-connection-settings';
import JetpackManageResponsesSettings from './components/jetpack-manage-responses-settings';
import NewsletterIntegrationSettings from './components/jetpack-newsletter-integration-settings';
import SalesforceLeadFormSettings from './components/jetpack-salesforce-lead-form/jetpack-salesforce-lead-form-settings';
import { withStyleVariables } from './util/with-style-variables';
import defaultVariations from './variations';

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

const RESPONSES_PATH = `${ get( getJetpackData(), 'adminUrl', false ) }edit.php?post_type=feedback`;
const CUSTOMIZING_FORMS_URL = 'https://jetpack.com/support/jetpack-blocks/contact-form/';

export const JetpackContactFormEdit = forwardRef(
	(
		{
			attributes,
			setAttributes,
			postAuthorEmail,
			hasInnerBlocks,
			replaceInnerBlocks,
			selectBlock,
			clientId,
			instanceId,
			className,
			blockType,
			variations,
			defaultVariation,
			canUserInstallPlugins,
			style,
		},
		ref
	) => {
		const {
			to,
			subject,
			customThankyou,
			customThankyouHeading,
			customThankyouMessage,
			customThankyouRedirect,
			jetpackCRM,
			salesforceData,
		} = attributes;

		const [ isPatternsModalOpen, setIsPatternsModalOpen ] = useState( false );

		const { isLoadingModules, isChangingStatus, isModuleActive, changeStatus } =
			useModuleStatus( 'contact-form' );

		const formClassnames = clsx( className, 'jetpack-contact-form', {
			'is-placeholder': ! hasInnerBlocks && registerBlockVariation,
		} );
		const isSalesForceExtensionEnabled =
			!! window?.Jetpack_Editor_Initial_State?.available_blocks[
				'contact-form/salesforce-lead-form'
			];

		const createBlocksFromInnerBlocksTemplate = innerBlocksTemplate => {
			const blocks = map( innerBlocksTemplate, ( [ name, attr, innerBlocks = [] ] ) =>
				createBlock( name, attr, createBlocksFromInnerBlocksTemplate( innerBlocks ) )
			);

			return blocks;
		};

		const setVariation = variation => {
			if ( variation.attributes ) {
				setAttributes( variation.attributes );
			}

			if ( variation.innerBlocks ) {
				replaceInnerBlocks(
					clientId,
					createBlocksFromInnerBlocksTemplate( variation.innerBlocks )
				);
			}

			selectBlock( clientId );
		};

		useEffect( () => {
			// Populate default variation on older versions of WP or GB that don't support variations.
			if ( ! hasInnerBlocks && ! registerBlockVariation ) {
				setVariation( defaultVariations[ 0 ] );
			}
		} );

		useEffect( () => {
			if (
				! hasInnerBlocks &&
				registerBlockVariation &&
				! isPatternsModalOpen &&
				window.location.search.indexOf( 'showJetpackFormsPatterns' ) !== -1
			) {
				setIsPatternsModalOpen( true );
			}
			// eslint-disable-next-line react-hooks/exhaustive-deps
		}, [] );

		const renderSubmissionSettings = () => {
			return (
				<>
					<InspectorHint>
						{ __( 'Customize the view after form submission:', 'jetpack-forms' ) }
					</InspectorHint>
					<SelectControl
						label={ __( 'On Submission', 'jetpack-forms' ) }
						value={ customThankyou }
						options={ [
							{ label: __( 'Show a summary of submitted fields', 'jetpack-forms' ), value: '' },
							{ label: __( 'Show a custom text message', 'jetpack-forms' ), value: 'message' },
							{ label: __( 'Redirect to another webpage', 'jetpack-forms' ), value: 'redirect' },
						] }
						onChange={ newMessage => setAttributes( { customThankyou: newMessage } ) }
					/>

					{ 'redirect' !== customThankyou && (
						<TextControl
							label={ __( 'Message Heading', 'jetpack-forms' ) }
							value={ customThankyouHeading }
							placeholder={ __( 'Your message has been sent', 'jetpack-forms' ) }
							onChange={ newHeading => setAttributes( { customThankyouHeading: newHeading } ) }
						/>
					) }

					{ 'message' === customThankyou && (
						<TextareaControl
							label={ __( 'Message Text', 'jetpack-forms' ) }
							value={ customThankyouMessage }
							placeholder={ __( 'Thank you for your submission!', 'jetpack-forms' ) }
							onChange={ newMessage => setAttributes( { customThankyouMessage: newMessage } ) }
						/>
					) }

					{ 'redirect' === customThankyou && (
						<BaseControl
							label={ __( 'Redirect Address', 'jetpack-forms' ) }
							id={ `contact-form-${ instanceId }-thankyou-url` }
						>
							<URLInput
								id={ `contact-form-${ instanceId }-thankyou-url` }
								value={ customThankyouRedirect }
								className="jetpack-contact-form__thankyou-redirect-url"
								onChange={ newURL => setAttributes( { customThankyouRedirect: newURL } ) }
							/>
						</BaseControl>
					) }
				</>
			);
		};

		const renderVariationPicker = () => {
			return (
				<div className={ formClassnames }>
					<BlockVariationPicker
						icon={ get( blockType, [ 'icon', 'src' ] ) }
						label={ get( blockType, [ 'title' ] ) }
						instructions={ __(
							'Start building a form by selecting one of these form templates, or search in the patterns library for more forms:',
							'jetpack-forms'
						) }
						variations={ filter( variations, v => ! v.hiddenFromPicker ) }
						onSelect={ ( nextVariation = defaultVariation ) => {
							setVariation( nextVariation );
						} }
					/>
					<div className="form-placeholder__footer">
						<Button variant="secondary" onClick={ () => setIsPatternsModalOpen( true ) }>
							{ __( 'Explore Form Patterns', 'jetpack-forms' ) }
						</Button>
						<div className="form-placeholder__footer-links">
							<Button
								variant="link"
								className="form-placeholder__external-link"
								href={ CUSTOMIZING_FORMS_URL }
								target="_blank"
							>
								{ __( 'Learn more about customizing forms', 'jetpack-forms' ) }
							</Button>
							<Button
								variant="link"
								className="form-placeholder__external-link"
								href={ RESPONSES_PATH }
								target="_blank"
							>
								{ __( 'View and export your form responses here', 'jetpack-forms' ) }
							</Button>
						</div>
					</div>
					{ isPatternsModalOpen && (
						<Modal
							className="form-placeholder__patterns-modal"
							title={ __( 'Choose a pattern', 'jetpack-forms' ) }
							closeLabel={ __( 'Cancel', 'jetpack-forms' ) }
							onRequestClose={ () => setIsPatternsModalOpen( false ) }
						>
							<BlockPatternSetup
								initialViewMode="grid"
								filterPatternsFn={ pattern => {
									return pattern.content.indexOf( 'jetpack/contact-form' ) !== -1;
								} }
								clientId={ clientId }
							/>
						</Modal>
					) }
				</div>
			);
		};

		if ( ! isModuleActive ) {
			if ( isLoadingModules ) {
				return <ContactFormSkeletonLoader />;
			}
			return (
				<ContactFormPlaceholder
					changeStatus={ changeStatus }
					isModuleActive={ isModuleActive }
					isLoading={ isChangingStatus }
				/>
			);
		}

		if ( ! hasInnerBlocks && registerBlockVariation ) {
			return renderVariationPicker();
		}

		return (
			<>
				<InspectorControls>
					{ ! attributes.formTitle && (
						<PanelBody>
							<Notice status="warning" isDismissible={ false }>
								{ __(
									'Add a heading inside the form or before it to help everybody identify it.',
									'jetpack-forms'
								) }
							</Notice>{ ' ' }
						</PanelBody>
					) }
					<PanelBody title={ __( 'Manage Responses', 'jetpack-forms' ) }>
						<JetpackManageResponsesSettings setAttributes={ setAttributes } />
					</PanelBody>
					<PanelBody title={ __( 'Submission Settings', 'jetpack-forms' ) } initialOpen={ false }>
						{ renderSubmissionSettings() }
					</PanelBody>
					<PanelBody title={ __( 'Email Connection', 'jetpack-forms' ) }>
						<JetpackEmailConnectionSettings
							emailAddress={ to }
							emailSubject={ subject }
							instanceId={ instanceId }
							postAuthorEmail={ postAuthorEmail }
							setAttributes={ setAttributes }
						/>
					</PanelBody>

					{ isSalesForceExtensionEnabled && salesforceData?.sendToSalesforce && (
						<SalesforceLeadFormSettings
							salesforceData={ salesforceData }
							setAttributes={ setAttributes }
							instanceId={ instanceId }
						/>
					) }
					{ ! ( isSimpleSite() || isAtomicSite() ) && (
						<Fragment>
							{ canUserInstallPlugins && (
								<PanelBody title={ __( 'CRM Connection', 'jetpack-forms' ) } initialOpen={ false }>
									<CRMIntegrationSettings
										jetpackCRM={ jetpackCRM }
										setAttributes={ setAttributes }
									/>
								</PanelBody>
							) }
							<PanelBody title={ __( 'Creative Mail', 'jetpack-forms' ) } initialOpen={ false }>
								<NewsletterIntegrationSettings />
							</PanelBody>
						</Fragment>
					) }
				</InspectorControls>

				<div className={ formClassnames } style={ style } ref={ ref }>
					<InnerBlocks
						allowedBlocks={ ALLOWED_BLOCKS }
						prioritizedInserterBlocks={ PRIORITIZED_INSERTER_BLOCKS }
						templateInsertUpdatesSelection={ false }
					/>
				</div>
			</>
		);
	}
);

const withThemeProvider = WrappedComponent => props => (
	<ThemeProvider>
		<WrappedComponent { ...props } />
	</ThemeProvider>
);

export default compose( [
	withSelect( ( select, props ) => {
		const { getBlockType, getBlockVariations, getDefaultBlockVariation } = select( 'core/blocks' );
		const { getBlocks } = select( 'core/block-editor' );
		const { getEditedPostAttribute } = select( 'core/editor' );
		const { getUser, canUser } = select( 'core' );
		const innerBlocks = getBlocks( props.clientId );

		const authorId = getEditedPostAttribute( 'author' );
		const authorEmail = authorId && getUser( authorId ) && getUser( authorId ).email;
		const canUserInstallPlugins = canUser( 'create', 'plugins' );

		const submitButton = innerBlocks.find( block => block.name === 'jetpack/button' );
		if ( submitButton && ! submitButton.attributes.lock ) {
			const lock = { move: false, remove: true };
			submitButton.attributes.lock = lock;
		}

		return {
			blockType: getBlockType && getBlockType( props.name ),
			canUserInstallPlugins,
			defaultVariation: getDefaultBlockVariation && getDefaultBlockVariation( props.name, 'block' ),
			variations: getBlockVariations && getBlockVariations( props.name, 'block' ),

			innerBlocks,
			hasInnerBlocks: innerBlocks.length > 0,
			postAuthorEmail: authorEmail,
		};
	} ),
	withDispatch( dispatch => {
		const { replaceInnerBlocks, selectBlock } = dispatch( 'core/block-editor' );
		return { replaceInnerBlocks, selectBlock };
	} ),
	withInstanceId,
	withThemeProvider,
] )( withStyleVariables( JetpackContactFormEdit ) );
