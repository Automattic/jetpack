import apiFetch from '@wordpress/api-fetch';
import { InnerBlocks, InspectorControls, RichText } from '@wordpress/block-editor';
import { Button, Placeholder, Spinner, TextControl, withNotices } from '@wordpress/components';
import { Fragment, Component } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { addQueryArgs } from '@wordpress/url';
import classnames from 'classnames';
import isCurrentUserConnected from '../../shared/is-current-user-connected';
import { NOTIFICATION_PROCESSING, NOTIFICATION_SUCCESS, NOTIFICATION_ERROR } from './constants';
import { MailChimpBlockControls } from './controls';
import { icon, innerButtonBlock } from '.';

const API_STATE_LOADING = 0;
const API_STATE_CONNECTED = 1;
const API_STATE_NOTCONNECTED = 2;

class MailchimpSubscribeEdit extends Component {
	constructor() {
		super( ...arguments );
		this.state = {
			audition: null,
			connected: API_STATE_LOADING,
			connectURL: null,
			currentUserConnected: null,
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
		const currentUserConnected = isCurrentUserConnected();
		if ( currentUserConnected ) {
			const path = '/wpcom/v2/mailchimp';
			const method = 'GET';
			const fetch = { path, method };
			apiFetch( fetch ).then(
				result => {
					const connectURL = result.connect_url;
					const connected =
						result.code === 'connected' ? API_STATE_CONNECTED : API_STATE_NOTCONNECTED;
					this.setState( { currentUserConnected, connected, connectURL } );
				},
				result => {
					const connectURL = null;
					const connected = API_STATE_NOTCONNECTED;
					this.setState( { currentUserConnected, connected, connectURL } );
					this.onError( result.message );
				}
			);
		} else {
			apiFetch( {
				path: addQueryArgs( '/jetpack/v4/connection/url', {
					from: 'jetpack-block-editor',
					redirect: window.location.href,
				} ),
			} ).then( connectUrl => {
				const connectURL = connectUrl;
				const connected = API_STATE_NOTCONNECTED;
				this.setState( { currentUserConnected, connected, connectURL } );
			} );
		}
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
		const { audition, connected, connectURL, currentUserConnected } = this.state;
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
			<Placeholder
				icon={ icon }
				notices={ notices }
				className="wp-block-jetpack-mailchimp"
				label={ __( 'Mailchimp', 'jetpack' ) }
			>
				<div className="align-center">
					<Spinner />
				</div>
			</Placeholder>
		);
		const placeholder = (
			<Placeholder
				className="wp-block-jetpack-mailchimp"
				icon={ icon }
				label={ __( 'Mailchimp', 'jetpack' ) }
				notices={ notices }
				instructions={ __(
					'You need to connect your Mailchimp account and choose an audience in order to start collecting Email subscribers.',
					'jetpack'
				) }
			>
				<Button variant="secondary" href={ connectURL } target="_blank">
					{ __( 'Set up Mailchimp form', 'jetpack' ) }
				</Button>
				<div className={ `${ classPrefix }-recheck` }>
					<Button variant="link" onClick={ this.apiCall }>
						{ __( 'Re-check Connection', 'jetpack' ) }
					</Button>
				</div>
			</Placeholder>
		);
		const placeholderNotUserConnected = (
			<Placeholder
				className="wp-block-jetpack-mailchimp"
				icon={ icon }
				label={ __( 'Mailchimp', 'jetpack' ) }
				notices={ notices }
				instructions={ __(
					"First, you'll need to connect your WordPress.com account.",
					'jetpack'
				) }
			>
				<Button variant="secondary" href={ connectURL }>
					{ __( 'Connect to WordPress.com', 'jetpack' ) }
				</Button>
			</Placeholder>
		);
		const inspectorControls = (
			<InspectorControls>
				<MailChimpBlockControls
					auditionNotification={ this.auditionNotification }
					clearAudition={ this.clearAudition }
					emailPlaceholder={ emailPlaceholder }
					processingLabel={ processingLabel }
					successLabel={ successLabel }
					errorLabel={ errorLabel }
					interests={ interests }
					setAttributes={ this.props.setAttributes }
					signupFieldTag={ signupFieldTag }
					signupFieldValue={ signupFieldValue }
					connectURL={ connectURL }
				/>
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
				<InnerBlocks
					template={ [ [ innerButtonBlock.name, innerButtonBlock.attributes ] ] }
					templateLock="all"
				/>
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
				{ ! preview && connected === API_STATE_NOTCONNECTED && currentUserConnected && placeholder }
				{ ! preview &&
					connected === API_STATE_NOTCONNECTED &&
					! currentUserConnected &&
					placeholderNotUserConnected }
				{ ! preview && connected === API_STATE_CONNECTED && inspectorControls }
				{ ! preview && connected === API_STATE_CONNECTED && blockContent }
			</Fragment>
		);
	};
}

export default withNotices( MailchimpSubscribeEdit );
