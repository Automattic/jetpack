/**
 * External dependencies
 */
import { get, map } from 'lodash';
import classnames from 'classnames';
import emailValidator from 'email-validator';
import { __, sprintf } from '@wordpress/i18n';
import { useEffect, useState } from '@wordpress/element';
import { compose, withInstanceId } from '@wordpress/compose';
import { createBlock, registerBlockVariation } from '@wordpress/blocks';
import { withDispatch, withSelect } from '@wordpress/data';
import { DOWN } from '@wordpress/keycodes';
import {
	InnerBlocks,
	InspectorControls,
	URLInput,
	__experimentalBlockVariationPicker as BlockVariationPicker,
	BlockControls,
} from '@wordpress/block-editor';
import {
	BaseControl,
	PanelBody,
	SelectControl,
	TextareaControl,
	TextControl,
	ToolbarGroup,
	Button,
	Dropdown,
	Icon,
} from '@wordpress/components';

/**
 * Internal dependencies
 */
import HelpMessage from '../../shared/help-message';
import defaultVariations from './variations';
import CRMConnectionSettings from './components/jetpack-crm-connection-settings';

const ALLOWED_BLOCKS = [
	'jetpack/markdown',
	'core/paragraph',
	'core/image',
	'core/heading',
	'core/gallery',
	'core/list',
	'core/quote',
	'core/shortcode',
	'core/audio',
	'core/code',
	'core/cover',
	'core/file',
	'core/html',
	'core/separator',
	'core/spacer',
	'core/subhead',
	'core/table',
	'core/verse',
	'core/video',
];

function JetpackContactFormEdit( {
	attributes,
	setAttributes,
	adminEmail,
	hasInnerBlocks,
	replaceInnerBlocks,
	selectBlock,
	clientId,
	instanceId,
	className,
	blockType,
	variations,
	defaultVariation,
} ) {
	const {
		to,
		subject,
		customThankyou,
		customThankyouMessage,
		customThankyouRedirect,
		jetpackCRM,
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
						__( '%s is not a valid email address.', 'jetpack' ),
						emailErrors[ 0 ].email
					);
				}
				return emailErrors[ 0 ];
			}

			if ( emailErrors.length === 2 ) {
				return sprintf(
					__( '%s and %s are not a valid email address.', 'jetpack' ),
					emailErrors[ 0 ].email,
					emailErrors[ 1 ].email
				);
			}

			const inValidEmails = emailErrors.map( error => error.email );

			return sprintf(
				__( '%s are not a valid email address.', 'jetpack' ),
				inValidEmails.join( ', ' )
			);
		}

		return null;
	};

	const onBlurEmailField = e => {
		if ( e.target.value.length === 0 ) {
			setEmailErrors( false );
			setAttributes( { to: adminEmail } );
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

	const renderFormSettings = () => {
		const email = to !== undefined ? to : adminEmail;

		return (
			<>
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
					value={ email }
					onBlur={ onBlurEmailField }
					onChange={ onChangeEmailField }
					help={ __( 'You can enter multiple email addresses separated by commas.', 'jetpack' ) }
				/>

				<HelpMessage isError id={ `contact-form-${ instanceId }-email-error` }>
					{ getEmailErrors() }
				</HelpMessage>

				<TextControl
					label={ __( 'Email subject line', 'jetpack' ) }
					value={ subject }
					placeholder={ __( 'Enter a subject', 'jetpack' ) }
					onChange={ newSubject => setAttributes( { subject: newSubject } ) }
					help={ __(
						'Choose a subject line that you recognize as an email from your website.',
						'jetpack'
					) }
				/>

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

	const renderFormSettingsToggle = ( isOpen, onToggle ) => {
		const openOnArrowDown = event => {
			if ( ! isOpen && event.keyCode === DOWN ) {
				event.preventDefault();
				event.stopPropagation();
				onToggle();
			}
		};

		return (
			<Button
				className="components-toolbar__control jetpack-contact-form__toggle"
				label={ __( 'Edit Form Settings' ) }
				onClick={ onToggle }
				onKeyDown={ openOnArrowDown }
				icon={ <Icon icon="edit" /> }
			/>
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
					variations={ variations }
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
			{ ToolbarGroup && (
				<BlockControls>
					<ToolbarGroup>
						<Dropdown
							position="bottom right"
							className="jetpack-contact-form-settings-selector"
							contentClassName="jetpack-contact-form__popover"
							renderToggle={ ( { isOpen, onToggle } ) =>
								renderFormSettingsToggle( isOpen, onToggle )
							}
							renderContent={ () => renderFormSettings() }
						/>
					</ToolbarGroup>
				</BlockControls>
			) }

			<InspectorControls>
				<PanelBody title={ __( 'Form Settings', 'jetpack' ) }>{ renderFormSettings() }</PanelBody>
				<PanelBody title={ __( 'CRM Integration', 'jetpack' ) } initialOpen={ false }>
					<CRMConnectionSettings jetpackCRM={ jetpackCRM } setAttributes={ setAttributes } />
				</PanelBody>
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
		const { getSite } = select( 'core' );
		const innerBlocks = getBlocks( props.clientId );

		return {
			blockType: getBlockType && getBlockType( props.name ),
			defaultVariation: getDefaultBlockVariation && getDefaultBlockVariation( props.name, 'block' ),
			variations: getBlockVariations && getBlockVariations( props.name, 'block' ),

			innerBlocks,
			hasInnerBlocks: innerBlocks.length > 0,

			adminEmail: get( getSite && getSite(), [ 'email' ] ),
		};
	} ),
	withDispatch( dispatch => {
		const { replaceInnerBlocks, selectBlock } = dispatch( 'core/block-editor' );
		return { replaceInnerBlocks, selectBlock };
	} ),
	withInstanceId,
] )( JetpackContactFormEdit );
