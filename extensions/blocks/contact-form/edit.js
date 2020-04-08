/**
 * External dependencies
 */
import { get, map } from 'lodash';
import classnames from 'classnames';
import emailValidator from 'email-validator';
import { __, sprintf } from '@wordpress/i18n';
import {
	BaseControl,
	PanelBody,
	SelectControl,
	TextareaControl,
	TextControl,
} from '@wordpress/components';
import { Component } from '@wordpress/element';
import { compose, withInstanceId } from '@wordpress/compose';
import {
	InnerBlocks,
	InspectorControls,
	URLInput,
	__experimentalBlockVariationPicker as BlockVariationPicker,
} from '@wordpress/block-editor';
import { createBlock, registerBlockVariation } from '@wordpress/blocks';
import { useDispatch, withSelect } from '@wordpress/data';

/**
 * Internal dependencies
 */
import HelpMessage from '../../shared/help-message';
import SubmitButton from '../../shared/submit-button';

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

class JetpackContactFormEdit extends Component {
	constructor( ...args ) {
		super( ...args );
		this.onChangeSubject = this.onChangeSubject.bind( this );
		this.onBlurTo = this.onBlurTo.bind( this );
		this.onChangeTo = this.onChangeTo.bind( this );
		this.onChangeSubmit = this.onChangeSubmit.bind( this );
		this.onFormSettingsSet = this.onFormSettingsSet.bind( this );
		this.getToValidationError = this.getToValidationError.bind( this );
		this.renderToAndSubjectFields = this.renderToAndSubjectFields.bind( this );
		this.preventEnterSubmittion = this.preventEnterSubmittion.bind( this );
		this.hasEmailError = this.hasEmailError.bind( this );

		const to = args[ 0 ].attributes.to ? args[ 0 ].attributes.to : '';
		const error = to
			.split( ',' )
			.map( this.getToValidationError )
			.filter( Boolean );

		this.state = {
			toError: error && error.length ? error : null,
		};
	}

	onChangeSubject( subject ) {
		this.props.setAttributes( { subject } );
	}

	getToValidationError( email ) {
		email = email.trim();
		if ( email.length === 0 ) {
			return false; // ignore the empty emails
		}
		if ( ! emailValidator.validate( email ) ) {
			return { email };
		}
		return false;
	}

	onBlurTo( event ) {
		const error = event.target.value
			.split( ',' )
			.map( this.getToValidationError )
			.filter( Boolean );
		if ( error && error.length ) {
			this.setState( { toError: error } );
			return;
		}
	}

	onChangeTo( to ) {
		const emails = to.trim();
		if ( emails.length === 0 ) {
			this.setState( { toError: null } );
			this.props.setAttributes( { to } );
			return;
		}

		this.setState( { toError: null } );
		this.props.setAttributes( { to } );
	}

	onChangeSubmit( submitButtonText ) {
		this.props.setAttributes( { submitButtonText } );
	}

	onFormSettingsSet( event ) {
		event.preventDefault();
		if ( this.state.toError ) {
			// don't submit the form if there are errors.
			return;
		}
		this.props.setAttributes( { hasFormSettingsSet: 'yes' } );
	}

	getfieldEmailError( errors ) {
		if ( errors ) {
			if ( errors.length === 1 ) {
				if ( errors[ 0 ] && errors[ 0 ].email ) {
					return sprintf( __( '%s is not a valid email address.', 'jetpack' ), errors[ 0 ].email );
				}
				return errors[ 0 ];
			}

			if ( errors.length === 2 ) {
				return sprintf(
					__( '%s and %s are not a valid email address.', 'jetpack' ),
					errors[ 0 ].email,
					errors[ 1 ].email
				);
			}
			const inValidEmails = errors.map( error => error.email );
			return sprintf(
				__( '%s are not a valid email address.', 'jetpack' ),
				inValidEmails.join( ', ' )
			);
		}
		return null;
	}

	preventEnterSubmittion( event ) {
		if ( event.key === 'Enter' ) {
			event.preventDefault();
			event.stopPropagation();
		}
	}

	renderToAndSubjectFields() {
		const fieldEmailError = this.state.toError;
		const { instanceId, attributes } = this.props;
		const { subject, to } = attributes;
		return (
			<>
				<TextControl
					aria-describedby={ `contact-form-${ instanceId }-email-${
						this.hasEmailError() ? 'error' : 'help'
					}` }
					label={ __( 'Email address to send to', 'jetpack' ) }
					placeholder={ __( 'name@example.com', 'jetpack' ) }
					onKeyDown={ this.preventEnterSubmittion }
					value={ to }
					onBlur={ this.onBlurTo }
					onChange={ this.onChangeTo }
					help={ __( 'You can enter multiple email addresses separated by commas.', 'jetpack' ) }
				/>
				<HelpMessage isError id={ `contact-form-${ instanceId }-email-error` }>
					{ this.getfieldEmailError( fieldEmailError ) }
				</HelpMessage>

				<TextControl
					label={ __( 'Email subject line', 'jetpack' ) }
					value={ subject }
					placeholder={ __( "Let's work together", 'jetpack' ) }
					onChange={ this.onChangeSubject }
					help={ __(
						'Choose a subject line that you recognize as an email from your website.',
						'jetpack'
					) }
				/>
			</>
		);
	}

	renderConfirmationMessageFields() {
		const { instanceId } = this.props;
		const { customThankyou, customThankyouMessage, customThankyouRedirect } = this.props.attributes;
		return (
			<>
				<SelectControl
					label={ __( 'On Submission', 'jetpack' ) }
					value={ customThankyou }
					options={ [
						{ label: __( 'Show a summary of submitted fields', 'jetpack' ), value: '' },
						{ label: __( 'Show a custom text message', 'jetpack' ), value: 'message' },
						{ label: __( 'Redirect to another webpage', 'jetpack' ), value: 'redirect' },
					] }
					onChange={ value => this.props.setAttributes( { customThankyou: value } ) }
				/>
				{ 'message' === customThankyou && (
					<TextareaControl
						label={ __( 'Message Text', 'jetpack' ) }
						value={ customThankyouMessage }
						placeholder={ __( 'Thank you for your submission!', 'jetpack' ) }
						onChange={ value => this.props.setAttributes( { customThankyouMessage: value } ) }
					/>
				) }
				{ 'redirect' === customThankyou && (
					// @todo This can likely be simplified when WP 5.4 is the minimum supported version.
					// See https://github.com/Automattic/jetpack/pull/13745#discussion_r334712381
					<BaseControl
						label={ __( 'Redirect Address', 'jetpack' ) }
						id={ `contact-form-${ instanceId }-thankyou-url` }
					>
						<URLInput
							id={ `contact-form-${ instanceId }-thankyou-url` }
							value={ customThankyouRedirect }
							className="jetpack-contact-form__thankyou-redirect-url"
							onChange={ value => this.props.setAttributes( { customThankyouRedirect: value } ) }
						/>
					</BaseControl>
				) }
			</>
		);
	}

	hasEmailError() {
		const fieldEmailError = this.state.toError;
		return fieldEmailError && fieldEmailError.length > 0;
	}

	createBlocksFromInnerBlocksTemplate( innerBlocksTemplate ) {
		const blocks = map( innerBlocksTemplate, ( [ name, attributes, innerBlocks = [] ] ) =>
			createBlock( name, attributes, this.createBlocksFromInnerBlocksTemplate( innerBlocks ) )
		);

		return blocks;
	}

	render() {
		const {
			setAttributes,
			className,
			attributes,
			blockType,
			variations,
			defaultVariation,
			replaceInnerBlocks,
			hasInnerBlocks,
			selectBlock,
		} = this.props;

		const { hasFormSettingsSet } = attributes;
		const formClassnames = classnames( className, 'jetpack-contact-form', {
			'has-intro': ! hasFormSettingsSet,
		} );

		if ( ! hasInnerBlocks && registerBlockVariation ) {
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
							if ( nextVariation.attributes ) {
								setAttributes( nextVariation.attributes );
							}

							if ( nextVariation.innerBlocks ) {
								replaceInnerBlocks(
									this.props.clientId,
									this.createBlocksFromInnerBlocksTemplate( nextVariation.innerBlocks )
								);
							}

							selectBlock( this.props.clientId );
						} }
					/>
				</div>
			);
		}

		return (
			<>
				<InspectorControls>
					<PanelBody title={ __( 'Email Feedback Settings', 'jetpack' ) }>
						{ this.renderToAndSubjectFields() }
					</PanelBody>
					<PanelBody title={ __( 'Confirmation Message', 'jetpack' ) }>
						{ this.renderConfirmationMessageFields() }
					</PanelBody>
				</InspectorControls>
				<div className={ formClassnames }>
					<InnerBlocks allowedBlocks={ ALLOWED_BLOCKS } />
					<SubmitButton { ...this.props } />
				</div>
			</>
		);
	}
}

export default compose( [
	withSelect( ( select, props ) => {
		const { getBlockType, getBlockVariations, getDefaultBlockVariation } = select( 'core/blocks' );
		const { getBlocks } = select( 'core/block-editor' );
		const { replaceInnerBlocks, selectBlock } = useDispatch( 'core/block-editor' );
		const innerBlocks = getBlocks( props.clientId );

		return {
			blockType: getBlockType( props.name ),
			defaultVariation: getDefaultBlockVariation( props.name, 'block' ),
			variations: getBlockVariations( props.name, 'block' ),

			innerBlocks,
			hasInnerBlocks: select( 'core/block-editor' ).getBlocks( props.clientId ).length > 0,
			replaceInnerBlocks,
			selectBlock,
		};
	} ),
	withInstanceId,
] )( JetpackContactFormEdit );
