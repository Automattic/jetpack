/**
 * External dependencies
 */
import React from 'react';
import { connect } from 'react-redux';
import { translate as __ } from 'i18n-calypso';
import SimpleNotice from 'components/notice';

/**
 * Internal dependencies
 */

import { getCurrentVersion } from 'state/initial-state';
import {
	getJetpackStateNoticesErrorCode,
	getJetpackStateNoticesMessageCode,
	getJetpackStateNoticesErrorDescription
} from 'state/jetpack-notices';

const JetpackStateNotices = React.createClass( {
	displayName: 'JetpackStateNotices',
	getInitialState: function() {
		return { showNotice: true };
	},

	/**
	 * Only need to hide.  They will not appear on next page load.
	 */
	dismissJetpackStateNotice: function() {
		this.setState( { showNotice: false } );
	},

	getErrorFromKey: function( key ) {
		const errorDesc = this.props.jetpackStateNoticesErrorDescription || false;
		let message = '';

		switch ( key ) {
			case 'cheatin' :
				message = __( 'Cheatin\' uh?' );
				break;
			case 'access_denied' :
				message = __( '{{p}}Would you mind telling us why you did not complete the Jetpack connection in this {{a}}2 question survey{{/a}}?{{/p}}' +
					'{{p}}A Jetpack connection is required for our free security and traffic features to work.{{/p}}',
					{
						components: {
							a: <a href="https://jetpack.com/cancelled-connection/" target="_blank" />,
							p: <p/>
						}
					}
				);
				break;
			case 'wrong_state' :
				message = __( 'You need to stay logged in to your WordPress blog while you authorize Jetpack.' );
				break;
			case 'invalid_client' :
				message = __( 'We had an issue connecting Jetpack; deactivate then reactivate the Jetpack plugin, then connect again.' );
				break;
			case 'invalid_grant' :
				message = __( 'There was an issue connecting your Jetpack. Please click "Connect to WordPress.com" again.' );
				break;
			case 'site_inaccessible' :
			case 'site_requires_authorization' :
				message = __( 'Your website needs to be publicly accessible to use Jetpack: %(error_key)s',
					{
						args: {
							error_key: key
						}
					}
				);
				break;
			case 'not_public' :
				message = __( '{{s}}Your Jetpack has a glitch.{{/s}} Connecting this site with WordPress.com is not possible. ' +
					'This usually means your site is not publicly accessible (localhost).',
					{
						components: {
							s: <strong />
						}
					}
				);
				break;
			case 'wpcom_408' :
			case 'wpcom_5??' :
			case 'wpcom_bad_response' :
			case 'wpcom_outage' :
				message = __( 'WordPress.com is currently having problems and is unable to fuel up your Jetpack.  Please try again later.' );
				break;
			case 'register_http_request_failed' :
			case 'token_http_request_failed' :
				message = __( 'Jetpack could not contact WordPress.com: %(error_key)s.  This usually means something is incorrectly configured on your web host.',
					{
						args: {
							error_key: key
						}
					}
				);
				break;
			case 'no_role' :
			case 'no_cap' :
			case 'no_code' :
			case 'no_state' :
			case 'invalid_state' :
			case 'invalid_request' :
			case 'invalid_scope' :
			case 'unsupported_response_type' :
			case 'invalid_token' :
			case 'no_token' :
			case 'missing_secrets' :
			case 'home_missing' :
			case 'siteurl_missing' :
			case 'gmt_offset_missing' :
			case 'site_name_missing' :
			case 'secret_1_missing' :
			case 'secret_2_missing' :
			case 'site_lang_missing' :
			case 'home_malformed' :
			case 'siteurl_malformed' :
			case 'gmt_offset_malformed' :
			case 'timezone_string_malformed' :
			case 'site_name_malformed' :
			case 'secret_1_malformed' :
			case 'secret_2_malformed' :
			case 'site_lang_malformed' :
			case 'secrets_mismatch' :
			case 'verify_secret_1_missing' :
			case 'verify_secret_1_malformed' :
			case 'verify_secrets_missing' :
			case 'verify_secrets_mismatch' :
				message = __( '{{s}}Your Jetpack has a glitch.{{/s}}  We\'re sorry for the inconvenience. ' +
					'Please try again later, if the issue continues please contact support with this message: %(error_key)s',
					{
						components: {
							s: <strong />
						},
						args: {
							error_key: key
						}
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
					<br/>
					{ errorDesc }
				</div>
			)
		}

		return (
			<div>
				{ message }
			</div>
		)
	},

	getMessageFromKey: function( key ) {
		let message = '';
		let status = 'is-info';
		switch ( key ) {
			// This is the message that is shown on first page load after a Jetpack plugin update.
			case 'modules_activated' :
				message = __( 'Welcome to {{s}}Jetpack %(jetpack_version)s{{/s}}!',
					{
						args: {
							jetpack_version: this.props.currentVersion
						},
						components: {
							s: <strong />
						}
					}
				);
				break;
			case 'already_authorized' :
				message = __( 'Your Jetpack is already connected.' );
				status = 'is-success';
				break;
			case 'authorized' :
				message = __( "You're fueled up and ready to go, Jetpack is now active." );
				status = 'is-success';
				break;
			case 'linked' :
				message = __( "You're fueled up and ready to go." );
				status = 'is-success';
				break;

			default:
				message = key;
		}

		return [ message, status ];
	},

	renderContent: function() {
		let status = 'is-info';
		let noticeText = '';
		const error = this.props.jetpackStateNoticesErrorCode,
			message = this.props.jetpackStateNoticesMessageCode;

		if ( ! error && ! message ) {
			return;
		}

		if ( error ) {
			noticeText = this.getErrorFromKey( error );
			if ( error !== 'access_denied' ) {
				status = 'is-error';
			}
		}

		if ( message ) {
			const messageData = this.getMessageFromKey( message );
			noticeText = messageData[0];
			status = messageData[1];
		}

		return (
			<SimpleNotice
				status={ status }
				onDismissClick={ this.dismissJetpackStateNotice }
			>
				{ noticeText }
			</SimpleNotice>
		);
	},

	render() {
		return (
			<div>
				{ this.state.showNotice ? this.renderContent() : null }
			</div>
		);
	}
} );

export default connect(
	( state ) => {
		return {
			currentVersion: getCurrentVersion( state ),
			jetpackStateNoticesErrorCode: getJetpackStateNoticesErrorCode( state ),
			jetpackStateNoticesMessageCode: getJetpackStateNoticesMessageCode( state ),
			jetpackStateNoticesErrorDescription: getJetpackStateNoticesErrorDescription( state )
		};
	}
)( JetpackStateNotices );
