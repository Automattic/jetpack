/**
 * External dependencies
 */
import React from 'react';
import { connect } from 'react-redux';
import { translate as __ } from 'i18n-calypso';
import SimpleNotice from 'components/notice';

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
		switch ( key ) {
			case 'cheatin' :
				return __( "Cheatin' uh?" );
			case 'access_denied' :
				return __( '{{p}}Would you mind telling us why you did not complete the Jetpack connection in this {{a}}2 question survey{{/a}}?{{/p}}' +
					'{{p}}A Jetpack connection is required for our free security and traffic features to work.{{/p}}',
					{
						components: {
							a: <a href="https://jetpack.com/cancelled-connection/" target="_blank" />,
							p: <p/>
						}
					}
				);
			case 'wrong_state' :
				return __( 'You need to stay logged in to your WordPress blog while you authorize Jetpack.' );
			case 'invalid_client' :
				return __( 'We had an issue connecting Jetpack; deactivate then reactivate the Jetpack plugin, then connect again.' );
			case 'invalid_grant' :
				return __( 'There was an issue connecting your Jetpack. Please click "Connect to WordPress.com" again.' );
			case 'site_inaccessible' :
			case 'site_requires_authorization' :
				return __( 'Your website needs to be publicly accessible to use Jetpack: %(error_key)s',
					{
						args: {
							error_key: key
						}
					}
				);
			case 'not_public' :
				return __( '{{s}}Your Jetpack has a glitch.{{/s}} Connecting this site with WordPress.com is not possible. ' +
					'This usually means your site is not publicly accessible (localhost).',
					{
						components: {
							s: <strong />
						}
					}
				);
			case 'wpcom_408' :
			case 'wpcom_5??' :
			case 'wpcom_bad_response' :
			case 'wpcom_outage' :
				return __( 'WordPress.com is currently having problems and is unable to fuel up your Jetpack.  Please try again later.' );
			case 'register_http_request_failed' :
			case 'token_http_request_failed' :
				return __( 'Jetpack could not contact WordPress.com: %(error_key)s.  This usually means something is incorrectly configured on your web host.',
					{
						args: {
							error_key: key
						}
					}
				);
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
				return __( "{{s}}Your Jetpack has a glitch.{{/s}}  We're sorry for the inconvenience. " +
					"Please try again later, if the issue continues please contact support with this message: %(error_key)s",
					{
						components: {
							s: <strong />
						},
						args: {
							error_key: key
						}
					}
				);

			default:
				return key;
		}
	},

	getMessageFromKey: function( key ) {
		switch ( key ) {

			default:
				return key;
		}
	},

	renderContent: function() {
		let noticeText = '';
		const error = window.Initial_State.jetpackStateNotices.errorCode,
			message = window.Initial_State.jetpackStateNotices.messageCode;

		if ( ! error && ! message ) {
			return;
		}

		if ( error ) {
			noticeText = this.getErrorFromKey( error );
		}

		if ( message ) {
			noticeText = this.getMessageFromKey( message );
		}

		return (
			<SimpleNotice
				status="is-info"
				onClick={ this.dismissJetpackStateNotice }
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

export default JetpackStateNotices;
