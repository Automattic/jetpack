import { getJetpackData, isSimpleSite } from '@automattic/jetpack-shared-extension-utils';
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
} from '@wordpress/components';
import { compose, withInstanceId } from '@wordpress/compose';
import { withDispatch, withSelect } from '@wordpress/data';
import { forwardRef, Fragment, useEffect, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import classnames from 'classnames';
import { filter, every, get, isArray, map, remove } from 'lodash';
import InspectorHint from '../../shared/components/inspector-hint';
import { childBlocks } from './child-blocks';
import CRMIntegrationSettings from './components/jetpack-crm-integration/jetpack-crm-integration-settings';
import JetpackEmailConnectionSettings from './components/jetpack-email-connection-settings';
import JetpackManageResponsesSettings from './components/jetpack-manage-responses-settings';
import NewsletterIntegrationSettings from './components/jetpack-newsletter-integration-settings';
import SalesforceLeadFormSettings, {
	salesforceLeadFormVariation,
} from './components/jetpack-salesforce-lead-form/jetpack-salesforce-lead-form-settings';
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

const RESPONSES_PATH = `${ get( getJetpackData(), 'adminUrl', false ) }edit.php?post_type=feedback`;
const CUSTOMIZING_FORMS_URL = 'https://jetpack.com/support/jetpack-blocks/contact-form/';

export const JetpackContactFormEdit = forwardRef(
	(
		{
			attributes,
			setAttributes,
			siteTitle,
			postTitle,
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
			formTitle,
			salesforceData,
			hiddenFields,
		} = attributes;

		const [ isPatternsModalOpen, setIsPatternsModalOpen ] = useState( false );

		const formClassnames = classnames( className, 'jetpack-contact-form', {
			'is-placeholder': ! hasInnerBlocks && registerBlockVariation,
		} );
		const isSalesForceExtensionEnabled =
			!! window?.Jetpack_Editor_Initial_State?.available_blocks[
				'contact-form/salesforce-lead-form'
			];

		if ( isSalesForceExtensionEnabled ) {
			variations = [ ...variations, salesforceLeadFormVariation ];
		}

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
			if ( to === undefined && postAuthorEmail ) {
				setAttributes( { to: postAuthorEmail } );
			}

			if ( subject === undefined && siteTitle !== undefined && postTitle !== undefined ) {
				const emailSubject = '[' + siteTitle + '] ' + postTitle;
				setAttributes( { subject: emailSubject } );
			}
		}, [ to, postAuthorEmail, subject, siteTitle, postTitle, setAttributes ] );

		useEffect( () => {
			if ( ! hiddenFields.length ) {
				setAttributes( {
					hiddenFields: [ { uuid: Math.random() * 1000000, name: '', value: '', edit: 'both' } ],
				} );
			}
		} );

		const renderSubmissionSettings = () => {
			return (
				<>
					<InspectorHint>
						{ __( 'Customize the view after form submission:', 'jetpack' ) }
					</InspectorHint>
					<SelectControl
						label={ __( 'On Submission', 'jetpack' ) }
						value={ customThankyou }
						options={ [
							{ label: __( 'Show a summary of submitted fields', 'jetpack' ), value: '' },
							{ label: __( 'Show a custom text message', 'jetpack' ), value: 'message' },
							{ label: __( 'Redirect to another webpage', 'jetpack' ), value: 'redirect' },
						] }
						onChange={ newMessage => setAttributes( { customThankyou: newMessage } ) }
					/>

					{ 'redirect' !== customThankyou && (
						<TextControl
							label={ __( 'Message Heading', 'jetpack' ) }
							value={ customThankyouHeading }
							placeholder={ __( 'Your message has been sent', 'jetpack' ) }
							onChange={ newHeading => setAttributes( { customThankyouHeading: newHeading } ) }
						/>
					) }

					{ 'message' === customThankyou && (
						<TextareaControl
							label={ __( 'Message Text', 'jetpack' ) }
							value={ customThankyouMessage }
							placeholder={ __( 'Thank you for your submission!', 'jetpack' ) }
							onChange={ newMessage => setAttributes( { customThankyouMessage: newMessage } ) }
						/>
					) }

					{ 'redirect' === customThankyou && (
						<BaseControl
							label={ __( 'Redirect Address', 'jetpack' ) }
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
							'jetpack'
						) }
						variations={ filter( variations, v => ! v.hiddenFromPicker ) }
						onSelect={ ( nextVariation = defaultVariation ) => {
							setVariation( nextVariation );
						} }
					/>
					<div className="form-placeholder__footer">
						<Button variant="secondary" onClick={ () => setIsPatternsModalOpen( true ) }>
							{ __( 'Explore Form Patterns', 'jetpack' ) }
						</Button>
						<div className="form-placeholder__footer-links">
							<Button
								variant="link"
								className="form-placeholder__external-link"
								href={ CUSTOMIZING_FORMS_URL }
								target="_blank"
							>
								{ __( 'Learn more about customizing forms', 'jetpack' ) }
							</Button>
							<Button
								variant="link"
								className="form-placeholder__external-link"
								href={ RESPONSES_PATH }
								target="_blank"
							>
								{ __( 'View and export your form responses here', 'jetpack' ) }
							</Button>
						</div>
					</div>
					{ isPatternsModalOpen && (
						<Modal
							className="form-placeholder__patterns-modal"
							title={ __( 'Choose a pattern', 'jetpack' ) }
							closeLabel={ __( 'Cancel', 'jetpack' ) }
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

		if ( ! hasInnerBlocks && registerBlockVariation ) {
			return renderVariationPicker();
		}

		const setHiddenField = ( key, newName, newValue, editMode ) => {
			const newHiddenFields = map( hiddenFields, ( { uuid, name, value, edit } ) => {
				const hiddenField = {
					uuid,
					name,
					value,
					edit,
				};
				if ( key === uuid ) {
					hiddenField.name = editMode === 'both' || editMode === 'name' ? newName : name;
					hiddenField.value = editMode === 'both' || editMode === 'name' ? newValue : value;
				}
				return hiddenField;
			} );

			remove( newHiddenFields, hf => ! hf.name.trim() && ! hf.value.trim() );

			// if all hidden fields have some value, add an empty one at the end
			every( newHiddenFields, 'value' ) &&
				newHiddenFields.push( {
					uuid: Math.random() * 1000000,
					name: '',
					value: '',
					edit: 'both',
				} );

			setAttributes( {
				hiddenFields: newHiddenFields,
			} );
		};

		const HiddenFieldInspector = ( props, setter ) => {
			const { uuid, name, value, edit = 'both' } = props;
			return (
				<div
					key={ uuid }
					style={ { display: 'flex' } }
					className="jetpack-contact-form__hidden-fields-panel"
				>
					{ ( edit === 'both' || edit === 'name' ) && (
						<TextControl
							value={ name }
							placeholder={ __( 'Field name', 'jetpack' ) }
							onChange={ fieldName => setter( uuid, fieldName, value, edit ) }
						/>
					) }
					{ ( ! edit || edit === 'value' || edit === 'none' ) && <span>{ name }</span> }
					{ ( edit === 'both' || edit === 'value' ) && (
						<TextControl
							value={ value }
							placeholder={ __( 'Field value', 'jetpack' ) }
							onChange={ fieldValue => setter( uuid, name, fieldValue, edit ) }
						/>
					) }
					{ ( ! edit || edit === 'value' || edit === 'none' ) && <span>{ value }</span> }
				</div>
			);
		};

		// eslint-disable-next-line no-console
		console.log( hiddenFields );

		return (
			<>
				<InspectorControls>
					<PanelBody title={ __( 'Manage Responses', 'jetpack' ) }>
						<JetpackManageResponsesSettings
							formTitle={ formTitle }
							setAttributes={ setAttributes }
						/>
					</PanelBody>
					<PanelBody title={ __( 'Submission Settings', 'jetpack' ) } initialOpen={ false }>
						{ renderSubmissionSettings() }
					</PanelBody>
					<PanelBody title={ __( 'Email Connection', 'jetpack' ) }>
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
					{ ! isSimpleSite() && (
						<Fragment>
							{ canUserInstallPlugins && (
								<PanelBody title={ __( 'CRM Connection', 'jetpack' ) } initialOpen={ false }>
									<CRMIntegrationSettings
										jetpackCRM={ jetpackCRM }
										setAttributes={ setAttributes }
									/>
								</PanelBody>
							) }
							<PanelBody title={ __( 'Newsletter Connection', 'jetpack' ) } initialOpen={ false }>
								<NewsletterIntegrationSettings />
							</PanelBody>
						</Fragment>
					) }
					<PanelBody title={ __( 'Hidden Fields', 'jetpack' ) }>
						<InspectorHint>
							{ __(
								"Use hidden fields to get fixed data alongside visitor's submissions.",
								'jetpack'
							) }
						</InspectorHint>
						{ map( hiddenFields, ( { uuid, name, value, edit } ) => {
							return HiddenFieldInspector( { uuid, name, value, edit }, setHiddenField );
						} ) }
					</PanelBody>
				</InspectorControls>

				<div className={ formClassnames } style={ style } ref={ ref }>
					<InnerBlocks allowedBlocks={ ALLOWED_BLOCKS } templateInsertUpdatesSelection={ false } />
				</div>
			</>
		);
	}
);

export default compose( [
	withSelect( ( select, props ) => {
		const { getBlockType, getBlockVariations, getDefaultBlockVariation } = select( 'core/blocks' );
		const { getBlocks } = select( 'core/block-editor' );
		const { getEditedPostAttribute } = select( 'core/editor' );
		const { getSite, getUser, canUser } = select( 'core' );
		const innerBlocks = getBlocks( props.clientId );

		const authorId = getEditedPostAttribute( 'author' );
		const authorEmail = authorId && getUser( authorId ) && getUser( authorId ).email;
		const postTitle = getEditedPostAttribute( 'title' );
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
			siteTitle: get( getSite && getSite(), [ 'title' ] ),
			postTitle: postTitle,
			postAuthorEmail: authorEmail,
		};
	} ),
	withDispatch( dispatch => {
		const { replaceInnerBlocks, selectBlock } = dispatch( 'core/block-editor' );
		return { replaceInnerBlocks, selectBlock };
	} ),
	withInstanceId,
] )( withStyleVariables( JetpackContactFormEdit ) );
