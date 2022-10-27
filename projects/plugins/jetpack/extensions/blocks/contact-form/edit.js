import { isSimpleSite } from '@automattic/jetpack-shared-extension-utils';
import {
	InnerBlocks,
	InspectorControls,
	URLInput,
	__experimentalBlockVariationPicker as BlockVariationPicker, // eslint-disable-line wpcalypso/no-unsafe-wp-apis
} from '@wordpress/block-editor';
import { createBlock, registerBlockVariation } from '@wordpress/blocks';
import {
	BaseControl,
	Button,
	PanelBody,
	SelectControl,
	TextareaControl,
	TextControl,
} from '@wordpress/components';
import { compose, withInstanceId } from '@wordpress/compose';
import { withDispatch, withSelect } from '@wordpress/data';
import { useEffect, useState, Fragment } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import classnames from 'classnames';
import emailValidator from 'email-validator';
import { get, map, filter } from 'lodash';
import HelpMessage from '../../shared/help-message';
import CRMIntegrationSettings from './components/jetpack-crm-integration/jetpack-crm-integration-settings';
import NewsletterIntegrationSettings from './components/jetpack-newsletter-integration-settings';
import defaultVariations from './variations';

const ALLOWED_BLOCKS = [
	'core/audio',
	'core/heading',
	'core/image',
	'core/list',
	'core/paragraph',
	'core/separator',
	'core/spacer',
	'core/subhead',
	'core/video',
];

export function JetpackContactFormEdit( {
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
} ) {
	const {
		to,
		subject,
		customThankyou,
		customThankyouHeading,
		customThankyouMessage,
		customThankyouRedirect,
		jetpackCRM,
		formTitle,
	} = attributes;

	const [ emailErrors, setEmailErrors ] = useState( false );
	const formClassnames = classnames( className, 'jetpack-contact-form' );

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
			replaceInnerBlocks( clientId, createBlocksFromInnerBlocksTemplate( variation.innerBlocks ) );
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

	const validateEmail = email => {
		email = email.trim();

		if ( email.length === 0 ) {
			return false; // ignore the empty emails
		}

		if ( ! emailValidator.validate( email ) ) {
			return { email };
		}

		return false;
	};

	const hasEmailErrors = () => {
		return emailErrors && emailErrors.length > 0;
	};

	const getEmailErrors = () => {
		if ( emailErrors ) {
			if ( emailErrors.length === 1 ) {
				if ( emailErrors[ 0 ] && emailErrors[ 0 ].email ) {
					return sprintf(
						/* translators: placeholder is an email address. */
						__( '%s is not a valid email address.', 'jetpack' ),
						emailErrors[ 0 ].email
					);
				}
				return emailErrors[ 0 ];
			}

			if ( emailErrors.length === 2 ) {
				return sprintf(
					/* translators: placeholders are email addresses. */
					__( '%1$s and %2$s are not a valid email address.', 'jetpack' ),
					emailErrors[ 0 ].email,
					emailErrors[ 1 ].email
				);
			}

			const inValidEmails = emailErrors.map( error => error.email );

			return sprintf(
				/* translators: placeholder is a list of email addresses. */
				__( '%s are not a valid email address.', 'jetpack' ),
				inValidEmails.join( ', ' )
			);
		}

		return null;
	};

	const onBlurEmailField = e => {
		if ( e.target.value.length === 0 ) {
			setEmailErrors( false );
			setAttributes( { to: postAuthorEmail } );
			return;
		}

		const error = e.target.value.split( ',' ).map( validateEmail ).filter( Boolean );

		if ( error && error.length ) {
			setEmailErrors( error );
			return;
		}
	};

	const onChangeEmailField = email => {
		setEmailErrors( false );
		setAttributes( { to: email.trim() } );
	};

	const SectionDescription = ( { children } ) => (
		<p
			style={ {
				color: 'rgba( 117, 117, 117, 1 )',
				marginBottom: '24px',
			} }
		>
			{ children }
		</p>
	);

	const renderEmailConnection = () => {
		const emailAddr = to !== undefined ? to : '';
		const emailSubject = subject !== undefined ? subject : '';

		return (
			<>
				<SectionDescription>
					{ __( 'Get incoming form responses sent to your email inbox:', 'jetpack' ) }
				</SectionDescription>
				<TextControl
					aria-describedby={ `contact-form-${ instanceId }-email-${
						hasEmailErrors() ? 'error' : 'help'
					}` }
					label={ __( 'Email address to send to', 'jetpack' ) }
					placeholder={ __( 'name@example.com', 'jetpack' ) }
					onKeyDown={ e => {
						if ( event.key === 'Enter' ) {
							e.preventDefault();
							e.stopPropagation();
						}
					} }
					value={ emailAddr }
					onBlur={ onBlurEmailField }
					onChange={ onChangeEmailField }
					help={ __( 'You can enter multiple email addresses separated by commas.', 'jetpack' ) }
				/>

				<HelpMessage isError id={ `contact-form-${ instanceId }-email-error` }>
					{ getEmailErrors() }
				</HelpMessage>

				<TextControl
					label={ __( 'Email subject line', 'jetpack' ) }
					value={ emailSubject }
					placeholder={ __( 'Enter a subject', 'jetpack' ) }
					onChange={ newSubject => setAttributes( { subject: newSubject } ) }
					help={ __(
						'Choose a subject line that you recognize as an email from your website.',
						'jetpack'
					) }
				/>
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
						"Please select which type of form you'd like to add, or create your own using the skip option.",
						'jetpack'
					) }
					variations={ filter( variations, v => ! v.hiddenFromPicker ) }
					allowSkip
					onSelect={ ( nextVariation = defaultVariation ) => {
						setVariation( nextVariation );
					} }
				/>
			</div>
		);
	};

	if ( ! hasInnerBlocks && registerBlockVariation ) {
		return renderVariationPicker();
	}

	return (
		<>
			<InspectorControls>
				<PanelBody title={ __( 'Manage Responses', 'jetpack' ) }>
					<SectionDescription>
						{ __( 'Manage and export your form responses in WPAdmin:', 'jetpack' ) }
					</SectionDescription>
					<Button
						variant="secondary"
						href="/wp-admin/edit.php?post_type=feedback"
						target="_blank"
						style={ { marginBottom: '24px' } }
					>
						{ __( 'View Form Responses', 'jetpack' ) }
					</Button>
					<TextControl
						label={ __( 'Title of the Form', 'jetpack' ) }
						value={ formTitle }
						onChange={ value => setAttributes( { formTitle: value } ) }
						help={ __( 'Optional - not visible to viewers', 'jetpack' ) }
					/>
				</PanelBody>
				<PanelBody title={ __( 'Submission Settings', 'jetpack' ) }>
					<SectionDescription>
						{ __( 'Customize the view after form submission:', 'jetpack' ) }
					</SectionDescription>
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
							placeholder={ __( 'Message Sent', 'jetpack' ) }
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
				</PanelBody>
				<PanelBody title={ __( 'Email Connection', 'jetpack' ) }>
					{ renderEmailConnection() }
				</PanelBody>
				{ ! isSimpleSite() && (
					<Fragment>
						{ canUserInstallPlugins && (
							<CRMIntegrationSettings jetpackCRM={ jetpackCRM } setAttributes={ setAttributes } />
						) }
						<NewsletterIntegrationSettings />
					</Fragment>
				) }
			</InspectorControls>

			<div className={ formClassnames }>
				<InnerBlocks allowedBlocks={ ALLOWED_BLOCKS } templateInsertUpdatesSelection={ false } />
			</div>
		</>
	);
}

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
] )( JetpackContactFormEdit );
