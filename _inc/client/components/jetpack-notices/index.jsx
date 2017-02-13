/**
 * External dependencies
 */
import React from 'react';
import { connect } from 'react-redux';
import SimpleNotice from 'components/notice';
import NoticeAction from 'components/notice/notice-action.jsx';
import { translate as __ } from 'i18n-calypso';
import NoticesList from 'components/global-notices';

/**
 * Internal dependencies
 */
import JetpackStateNotices from './state-notices';
import { getSiteConnectionStatus, getSiteDevMode, isStaging, isInIdentityCrisis } from 'state/connection';
import { isDevVersion } from 'state/initial-state';
import DismissableNotices from './dismissable';
import { getConnectUrl as _getConnectUrl } from 'state/connection';
import QueryConnectUrl from 'components/data/query-connect-url';

export const DevVersionNotice = React.createClass( {
	displayName: 'DevVersionNotice',

	render() {
		if ( this.props.isDevVersion ) {
			return (
				<SimpleNotice
					showDismiss={ false }
					status="is-basic"
					text={ __( 'You are currently running a development version of Jetpack.' ) }
				>
					<NoticeAction
						href="https://jetpack.com/contact-support/beta-group/"
					>
						{ __( 'Submit Beta feedback' ) }
					</NoticeAction>
				</SimpleNotice>
			);
		}

		return false;
	}

} );

DevVersionNotice.propTypes = {
	isDevVersion: React.PropTypes.bool.isRequired
};

export const StagingSiteNotice = React.createClass( {
	displayName: 'StagingSiteNotice',

	render() {
		if ( this.props.isStaging && ! this.props.isInIdentityCrisis ) {
			let stagingSiteSupportLink = 'https://jetpack.com/support/staging-sites/';

			let props = {
				text: 	__( 'You are running Jetpack on a staging server.' ),
				status: 'is-basic',
				showDismiss: false
			};

			return (
				<SimpleNotice { ... props }>
					<NoticeAction
						href={ stagingSiteSupportLink }
					>
						{ __( 'More Info' ) }
					</NoticeAction>
				</SimpleNotice>
			);
		}

		return false;
	}

} );

StagingSiteNotice.propTypes = {
	isStaging: React.PropTypes.bool.isRequired,
	isInIdentityCrisis: React.PropTypes.bool.isRequired
};

export const DevModeNotice = React.createClass( {
	displayName: 'DevModeNotice',

	render() {
		if ( this.props.siteConnectionStatus === 'dev' ) {
			const devMode = this.props.siteDevMode;
			let text;
			if ( devMode.filter ) {
				text = __( 'Currently in {{a}}Development Mode{{/a}} via the jetpack_development_mode filter.{{br/}}Some features are disabled.',
					{
						components: {
							a: <a href="https://jetpack.com/support/development-mode/" target="_blank"/>,
							br: <br />
						}
					}
				);
			} else if ( devMode.constant ) {
				text = __( 'Currently in {{a}}Development Mode{{/a}} via the JETPACK_DEV_DEBUG constant.{{br/}}Some features are disabled.',
					{
						components: {
							a: <a href="https://jetpack.com/support/development-mode/" target="_blank"/>,
							br: <br />
						}
					}
				);
			} else if ( devMode.url ) {
				text = __( 'Currently in {{a}}Development Mode{{/a}} because your site URL lacks a dot (e.g. http://localhost).{{br/}}Some features are disabled.',
					{
						components: {
							a: <a href="https://jetpack.com/support/development-mode/" target="_blank"/>,
							br: <br />
						}
					}
				);
			}

			return (
				<SimpleNotice
					showDismiss={ false }
					status="is-basic"
				>
					{ text }
				</SimpleNotice>
			);
		}

		return false;
	}

} );

DevModeNotice.propTypes = {
	siteConnectionStatus: React.PropTypes.oneOfType( [
		React.PropTypes.string,
		React.PropTypes.bool
	] ).isRequired,
	siteDevMode: React.PropTypes.oneOfType( [
		React.PropTypes.bool,
		React.PropTypes.object
	] ).isRequired
};

export const UserUnlinked = React.createClass( {
	displayName: 'UserUnlinked',

	render() {
		if (
			! window.Initial_State.userData.currentUser.isConnected &&
			this.props.connectUrl &&
			this.props.siteConnected
		) {
			let text;

			text = __( 'You, %(userName)s, are not connected to WordPress.com.', {
				args: {
					userName: window.Initial_State.userData.currentUser.username
				}
			} );

			return (
				<SimpleNotice
					showDismiss={ false }
					status="is-info"
					text={ text }
				>
					<NoticeAction
						href={ `${ this.props.connectUrl }&from=unlinked-user-connect` }
					>
						{ __( 'Link to WordPress.com' ) }
					</NoticeAction>
				</SimpleNotice>
			);
		}

		return false;
	}

} );

UserUnlinked.propTypes = {
	connectUrl: React.PropTypes.string.isRequired,
	siteConnected: React.PropTypes.bool.isRequired
};

const JetpackNotices = React.createClass( {
	displayName: 'JetpackNotices',

	render() {
		return (
			<div>
				<QueryConnectUrl />
				<NoticesList />
				<JetpackStateNotices />
				<DevVersionNotice isDevVersion={ this.props.isDevVersion } />
				<DevModeNotice
					siteConnectionStatus={ this.props.siteConnectionStatus }
					siteDevMode={ this.props.siteDevMode } />
				<StagingSiteNotice
					isStaging={ this.props.isStaging }
					isInIdentityCrisis={ this.props.isInIdentityCrisis } />
				<DismissableNotices />
				<UserUnlinked
					connectUrl={ this.props.connectUrl }
					siteConnected={ true === this.props.siteConnectionStatus } />
			</div>
		);
	}
} );

export default connect(
	state => {
		return {
			connectUrl: _getConnectUrl( state ),
			siteConnectionStatus: getSiteConnectionStatus( state ),
			isDevVersion: isDevVersion( state ),
			siteDevMode: getSiteDevMode( state ),
			isStaging: isStaging( state ),
			isInIdentityCrisis: isInIdentityCrisis( state )

		};
	}
)( JetpackNotices );
