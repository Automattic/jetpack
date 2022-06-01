import { getRedirectUrl } from '@automattic/jetpack-components';
import { createInterpolateElement } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import SimpleNotice from 'components/notice';
import NoticeAction from 'components/notice/notice-action.jsx';
import UpgradeNoticeContent from 'components/upgrade-notice-content';
import React from 'react';
import { connect } from 'react-redux';
import { getCurrentVersion, getSiteAdminUrl, isAtomicPlatform } from 'state/initial-state';
import {
	getJetpackStateNoticesErrorCode,
	getJetpackStateNoticesMessageCode,
	getJetpackStateNoticesErrorDescription,
	getJetpackStateNoticesMessageContent,
} from 'state/jetpack-notices';

class JetpackStateNotices extends React.Component {
	static displayName = 'JetpackStateNotices';
	state = { showNotice: true };

	/**
	 * Only need to hide.  They will not appear on next page load.
	 */
	dismissJetpackStateNotice = () => {
		this.setState( { showNotice: false } );
	};

	getErrorFromKey = key => {
		const errorDesc = this.props.jetpackStateNoticesErrorDescription || false;
		let message = '';

		switch ( key ) {
			case 'cheatin':
				message = __( "Cheatin' uh?", 'jetpack' );
				break;
			case 'access_denied':
				message = createInterpolateElement(
					__(
						'<p>Would you mind telling us why you did not complete the Jetpack connection in this <a>2 question survey</a>?</p><p>A Jetpack connection is required for our free security and traffic features to work.</p>',
						'jetpack'
					),
					{
						a: (
							<a
								href={ getRedirectUrl( 'jetpack-cancelled-connection' ) }
								target="_blank"
								rel="noopener noreferrer"
							/>
						),
						p: <p />,
					}
				);
				break;
			case 'wrong_state':
				message = __(
					'You need to stay logged in to your WordPress blog while you authorize Jetpack.',
					'jetpack'
				);
				break;
			case 'invalid_client':
				message = __(
					'We had an issue connecting Jetpack; deactivate then reactivate the Jetpack plugin, then connect again.',
					'jetpack'
				);
				break;
			case 'invalid_grant':
				message = __(
					'There was an issue connecting your Jetpack. Please click "Connect to WordPress.com" again.',
					'jetpack'
				);
				break;
			case 'site_inaccessible':
			case 'site_requires_authorization':
				message = sprintf(
					/* translators: placeholder is an error code and message. */
					__( 'Your website needs to be publicly accessible to use Jetpack: %s', 'jetpack' ),
					key
				);
				break;
			case 'site_blacklisted':
				message = createInterpolateElement(
					__(
						"This site can't be connected to WordPress.com because it violates our <a>Terms of Service</a>.",
						'jetpack'
					),
					{
						a: (
							<a href={ getRedirectUrl( 'wpcom-tos' ) } rel="noopener noreferrer" target="_blank" />
						),
					}
				);
				break;
			case 'not_public':
				message = createInterpolateElement(
					__(
						'<s>Your Jetpack has a glitch.</s> Connecting this site with WordPress.com is not possible. This usually means your site is not publicly accessible (localhost).',
						'jetpack'
					),
					{
						s: <strong />,
					}
				);
				break;
			case 'wpcom_408':
			case 'wpcom_5??':
			case 'wpcom_bad_response':
			case 'wpcom_outage':
				message = __(
					'WordPress.com is currently having problems and is unable to fuel up your Jetpack. Please try again later.',
					'jetpack'
				);
				break;
			case 'register_http_request_failed':
			case 'token_http_request_failed':
				message = sprintf(
					/* translators: placeholder is an error code and message. */
					__(
						'Jetpack could not contact WordPress.com: %s. This usually means something is incorrectly configured on your web host.',
						'jetpack'
					),
					key
				);
				break;
			case 'no_role':
			case 'no_cap':
			case 'no_code':
			case 'no_state':
			case 'invalid_state':
			case 'invalid_request':
			case 'invalid_scope':
			case 'unsupported_response_type':
			case 'invalid_token':
			case 'no_token':
			case 'missing_secrets':
			case 'home_missing':
			case 'siteurl_missing':
			case 'gmt_offset_missing':
			case 'site_name_missing':
			case 'secret_1_missing':
			case 'secret_2_missing':
			case 'site_lang_missing':
			case 'home_malformed':
			case 'siteurl_malformed':
			case 'gmt_offset_malformed':
			case 'timezone_string_malformed':
			case 'site_name_malformed':
			case 'secret_1_malformed':
			case 'secret_2_malformed':
			case 'site_lang_malformed':
			case 'secrets_mismatch':
			case 'verify_secret_1_missing':
			case 'verify_secret_1_malformed':
			case 'verify_secrets_missing':
			case 'verify_secrets_mismatch':
				message = createInterpolateElement(
					sprintf(
						/* translators: placeholder is an error code and message. */
						__(
							'<s>Your Jetpack has a glitch.</s> We’re sorry for the inconvenience. Please try again later, if the issue continues please contact support with this message: %s',
							'jetpack'
						),
						key
					),
					{
						s: <strong />,
					}
				);
				break;

			default:
				message = key;
		}

		if ( errorDesc ) {
			return (
				<div>
					{ message }
					<br />
					{ errorDesc }
				</div>
			);
		}

		return <div>{ message }</div>;
	};

	getMessageFromKey = key => {
		let message = '',
			status = 'is-info',
			action;
		switch ( key ) {
			// This is the message that is shown on first page load after a Jetpack plugin update.
			case 'modules_activated':
				if ( ! this.props.isAtomicPlatform ) {
					message = createInterpolateElement(
						sprintf(
							/* translators: placeholder is a version number, like 8.8. */
							__( 'Welcome to <s>Jetpack %s</s>!', 'jetpack' ),
							this.props.currentVersion
						),
						{
							s: <strong />,
						}
					);
				}
				break;
			case 'already_authorized':
				message = __( 'Your Jetpack is already connected.', 'jetpack' );
				status = 'is-success';
				break;
			case 'authorized':
				message = __( "You're fueled up and ready to go, Jetpack is now active.", 'jetpack' );
				status = 'is-success';
				break;
			case 'linked':
				message = __( "You're fueled up and ready to go.", 'jetpack' );
				status = 'is-success';
				break;
			case 'protect_misconfigured_ip':
				message = __(
					'Your server is misconfigured, which means that Jetpack Protect is unable to effectively protect your site.',
					'jetpack'
				);
				status = 'is-info';
				action = (
					<NoticeAction
						href={ getRedirectUrl( 'jetpack-support-security-troubleshooting-protect' ) }
					>
						{ __( 'Learn More', 'jetpack' ) }
					</NoticeAction>
				);
				break;
			case 'reconnection_completed':
				message = createInterpolateElement(
					__(
						'Jetpack successfully reconnected! You can check your Jetpack Connection health by visiting the <a>Site Health tool</a>.',
						'jetpack'
					),
					{
						a: <a href={ this.props.siteAdminUrl + 'site-health.php' } />,
					}
				);
				status = 'is-success';
				break;
			default:
				message = key;
		}

		return [ message, status, action ];
	};

	renderContent = () => {
		let status = 'is-info',
			noticeText = '',
			action;
		const error = this.props.jetpackStateNoticesErrorCode,
			message = this.props.jetpackStateNoticesMessageCode,
			messageContent = this.props.jetpackStateNoticesMessageContent;

		if ( ! error && ! message && ! messageContent ) {
			return;
		}

		if ( error ) {
			noticeText = this.getErrorFromKey( error );
			if ( error !== 'access_denied' ) {
				status = 'is-error';
			}
		}

		// Show custom message for updated Jetpack.
		if ( messageContent && messageContent.release_post_content && ! this.props.isAtomicPlatform ) {
			return (
				<UpgradeNoticeContent
					dismiss={ this.dismissJetpackStateNotice }
					version={ this.props.currentVersion }
					releasePostContent={ messageContent.release_post_content }
					featuredImage={ messageContent.release_post_featured_image }
					title={ messageContent.release_post_title }
				/>
			);
		}

		if ( message ) {
			const messageData = this.getMessageFromKey( message );
			noticeText = messageData[ 0 ];
			status = messageData[ 1 ];
			action = messageData[ 2 ];
		}

		if ( '' === noticeText ) {
			return;
		}

		return (
			<SimpleNotice
				status={ status }
				onDismissClick={ this.dismissJetpackStateNotice }
				text={ noticeText }
			>
				{ action }
			</SimpleNotice>
		);
	};

	render() {
		return <div>{ this.state.showNotice ? this.renderContent() : null }</div>;
	}
}

export default connect( state => {
	return {
		currentVersion: getCurrentVersion( state ),
		isAtomicPlatform: isAtomicPlatform( state ),
		jetpackStateNoticesErrorCode: getJetpackStateNoticesErrorCode( state ),
		jetpackStateNoticesMessageCode: getJetpackStateNoticesMessageCode( state ),
		jetpackStateNoticesErrorDescription: getJetpackStateNoticesErrorDescription( state ),
		jetpackStateNoticesMessageContent: getJetpackStateNoticesMessageContent( state ),
		siteAdminUrl: getSiteAdminUrl( state ),
	};
} )( JetpackStateNotices );
