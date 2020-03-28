/**
 * External dependencies
 */
import apiFetch from '@wordpress/api-fetch';
import classnames from 'classnames';
import SubmitButton from '../../shared/submit-button';
import { __ } from '@wordpress/i18n';
import {
	Button,
	ExternalLink,
	PanelBody,
	Placeholder,
	Spinner,
	TextControl,
	withNotices,
} from '@wordpress/components';
import { InspectorControls, RichText } from '@wordpress/block-editor';
import { Fragment, Component } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { icon } from '.';
import MailchimpGroups from './mailchimp-groups';

const API_STATE_LOADING = 0;
const API_STATE_CONNECTED = 1;
const API_STATE_NOTCONNECTED = 2;

const NOTIFICATION_PROCESSING = 'processing';
const NOTIFICATION_SUCCESS = 'success';
const NOTIFICATION_ERROR = 'error';

class MailchimpSubscribeEdit extends Component {
	constructor() {
		super( ...arguments );
		this.state = {
			audition: null,
			connected: API_STATE_LOADING,
			connectURL: null,
		};
		this.timeout = null;
	}

	componentDidMount = () => {
		this.apiCall();
	};

	onError = message => {
		const { noticeOperations } = this.props;
		noticeOperations.removeAllNotices();
		noticeOperations.createErrorNotice( message );
	};

	apiCall = () => {
		const path = '/wpcom/v2/mailchimp';
		const method = 'GET';
		const fetch = { path, method };
		apiFetch( fetch ).then(
			result => {
				const connectURL = result.connect_url;
				const connected =
					result.code === 'connected' ? API_STATE_CONNECTED : API_STATE_NOTCONNECTED;
				this.setState( { connected, connectURL } );
			},
			result => {
				const connectURL = null;
				const connected = API_STATE_NOTCONNECTED;
				this.setState( { connected, connectURL } );
				this.onError( result.message );
			}
		);
	};

	auditionNotification = notification => {
		this.setState( { audition: notification } );
		if ( this.timeout ) {
			clearTimeout( this.timeout );
		}
		this.timeout = setTimeout( this.clearAudition, 3000 );
	};

	clearAudition = () => {
		this.setState( { audition: null } );
	};

	updateProcessingText = processingLabel => {
		const { setAttributes } = this.props;
		setAttributes( { processingLabel } );
		this.auditionNotification( NOTIFICATION_PROCESSING );
	};

	updateSuccessText = successLabel => {
		const { setAttributes } = this.props;
		setAttributes( { successLabel } );
		this.auditionNotification( NOTIFICATION_SUCCESS );
	};

	updateErrorText = errorLabel => {
		const { setAttributes } = this.props;
		setAttributes( { errorLabel } );
		this.auditionNotification( NOTIFICATION_ERROR );
	};

	updateEmailPlaceholder = emailPlaceholder => {
		const { setAttributes } = this.props;
		setAttributes( { emailPlaceholder } );
		this.clearAudition();
	};

	labelForAuditionType = audition => {
		const { attributes } = this.props;
		const { processingLabel, successLabel, errorLabel } = attributes;
		if ( audition === NOTIFICATION_PROCESSING ) {
			return processingLabel;
		} else if ( audition === NOTIFICATION_SUCCESS ) {
			return successLabel;
		} else if ( audition === NOTIFICATION_ERROR ) {
			return errorLabel;
		}
		return null;
	};

	roleForAuditionType = audition => {
		if ( audition === NOTIFICATION_ERROR ) {
			return 'alert';
		}
		return 'status';
	};

	render = () => {
		const { attributes, className, notices, noticeUI, setAttributes } = this.props;
		const { audition, connected, connectURL } = this.state;
		const {
			emailPlaceholder,
			consentText,
			interests,
			processingLabel,
			successLabel,
			errorLabel,
			preview,
			signupFieldTag,
			signupFieldValue,
		} = attributes;
		const classPrefix = 'wp-block-jetpack-mailchimp';
		const waiting = (
			<Placeholder icon={ icon } notices={ notices }>
				<Spinner />
			</Placeholder>
		);
		const placeholder = (
			<Placeholder
				className="wp-block-jetpack-mailchimp"
				icon={ icon }
				label={ __( 'Mailchimp', 'jetpack' ) }
				notices={ notices }
				instructions={ __(
					'You need to connect your Mailchimp account and choose a list in order to start collecting Email subscribers.',
					'jetpack'
				) }
			>
				<Button isDefault isLarge href={ connectURL } target="_blank">
					{ __( 'Set up Mailchimp form', 'jetpack' ) }
				</Button>
				<div className={ `${ classPrefix }-recheck` }>
					<Button isLink onClick={ this.apiCall }>
						{ __( 'Re-check Connection', 'jetpack' ) }
					</Button>
				</div>
			</Placeholder>
		);
		const inspectorControls = (
			<InspectorControls>
				<PanelBody title={ __( 'Text Elements', 'jetpack' ) }>
					<TextControl
						label={ __( 'Email Placeholder', 'jetpack' ) }
						value={ emailPlaceholder }
						onChange={ this.updateEmailPlaceholder }
					/>
				</PanelBody>
				<PanelBody title={ __( 'Notifications', 'jetpack' ) }>
					<TextControl
						label={ __( 'Processing text', 'jetpack' ) }
						value={ processingLabel }
						onChange={ this.updateProcessingText }
					/>
					<TextControl
						label={ __( 'Success text', 'jetpack' ) }
						value={ successLabel }
						onChange={ this.updateSuccessText }
					/>
					<TextControl
						label={ __( 'Error text', 'jetpack' ) }
						value={ errorLabel }
						onChange={ this.updateErrorText }
					/>
				</PanelBody>
				<PanelBody title={ __( 'Mailchimp Groups', 'jetpack' ) }>
					<MailchimpGroups
						interests={ interests }
						onChange={ ( id, checked ) => {
							// Create a Set to insure no duplicate interests
							const deDupedInterests = [ ...new Set( [ ...interests, id ] ) ];
							// Filter the clicked interest based on checkbox's state.
							const updatedInterests = deDupedInterests.filter( item =>
								item === id && ! checked ? false : item
							);
							setAttributes( {
								interests: updatedInterests,
							} );
						} }
					/>
					<ExternalLink href="https://mailchimp.com/help/send-groups-audience/">
						{ __( 'Learn about groups', 'jetpack' ) }
					</ExternalLink>
				</PanelBody>
				<PanelBody title={ __( 'Signup Location Tracking', 'jetpack' ) }>
					<TextControl
						label={ __( 'Signup Field Tag', 'jetpack' ) }
						placeholder={ __( 'SIGNUP' ) }
						value={ signupFieldTag }
						onChange={ value => setAttributes( { signupFieldTag: value } ) }
					/>
					<TextControl
						label={ __( 'Signup Field Value', 'jetpack' ) }
						placeholder={ __( 'website' ) }
						value={ signupFieldValue }
						onChange={ value => setAttributes( { signupFieldValue: value } ) }
					/>
					<ExternalLink href="https://mailchimp.com/help/determine-webpage-signup-location/">
						{ __( 'Learn about signup location tracking', 'jetpack' ) }
					</ExternalLink>
				</PanelBody>
				<PanelBody title={ __( 'Mailchimp Connection', 'jetpack' ) }>
					<ExternalLink href={ connectURL }>{ __( 'Manage Connection', 'jetpack' ) }</ExternalLink>
				</PanelBody>
			</InspectorControls>
		);
		const blockClasses = classnames( className, {
			[ `${ classPrefix }_notication-audition` ]: audition,
		} );
		const blockContent = (
			<div className={ blockClasses }>
				<TextControl
					aria-label={ emailPlaceholder }
					className="wp-block-jetpack-mailchimp_text-input"
					disabled
					onChange={ () => false }
					placeholder={ emailPlaceholder }
					title={ __( 'You can edit the email placeholder in the sidebar.', 'jetpack' ) }
					type="email"
				/>
				<SubmitButton { ...this.props } />
				<RichText
					tagName="p"
					placeholder={ __( 'Write consent text', 'jetpack' ) }
					value={ consentText }
					onChange={ value => setAttributes( { consentText: value } ) }
					inlineToolbar
				/>
				{ audition && (
					<div
						className={ `${ classPrefix }_notification ${ classPrefix }_${ audition }` }
						role={ this.roleForAuditionType( audition ) }
					>
						{ this.labelForAuditionType( audition ) }
					</div>
				) }
			</div>
		);
		const previewUI = blockContent;

		return (
			<Fragment>
				{ noticeUI }
				{ preview && previewUI }
				{ ! preview && connected === API_STATE_LOADING && waiting }
				{ ! preview && connected === API_STATE_NOTCONNECTED && placeholder }
				{ ! preview && connected === API_STATE_CONNECTED && inspectorControls }
				{ ! preview && connected === API_STATE_CONNECTED && blockContent }
			</Fragment>
		);
	};
}

export default withNotices( MailchimpSubscribeEdit );
