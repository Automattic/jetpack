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
import { getSiteConnectionStatus, getSiteDevMode, isStaging } from 'state/connection';
import { isDevVersion } from 'state/initial-state';
import DismissableNotices from './dismissable';
import { getConnectUrl as _getConnectUrl } from 'state/connection';
import QueryConnectUrl from 'components/data/query-connect-url';

export const DevVersionNotice = React.createClass( {
	displayName: 'DevVersionNotice',

	render() {
		if ( isDevVersion( this.props ) ) {
			const text = __( 'You are currently running a development version of Jetpack. {{a}} Submit your feedback {{/a}}',
				{
					components: {
						a: <a href="https://jetpack.com/contact-support/beta-group/" target="_blank" />
					}
				}
			);

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

export const StagingSiteNotice = React.createClass( {
	displayName: 'StagingSiteNotice',

	render() {
		if ( isStaging( this.props ) ) {
			const text = __( 'You are running Jetpack on a {{a}}staging server{{/a}}.',
				{
					components: {
						a: <a href="https://jetpack.com/support/staging-sites/" target="_blank" />
					}
				}
			);

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

export const DevModeNotice = React.createClass( {
	displayName: 'DevModeNotice',

	render() {
		if ( getSiteConnectionStatus( this.props ) === 'dev' ) {
			const devMode = getSiteDevMode( this.props );
			let text;
			if ( devMode.filter ) {
				text = __('Currently in {{a}}Development Mode{{/a}} via the jetpack_development_mode filter.{{br/}}Some features are disabled.',
					{
						components: {
							a: <a href="https://jetpack.com/support/development-mode/" target="_blank"/>,
							br: <br />
						}
					}
				);
			} else if ( devMode.constant ) {
				text = __('Currently in {{a}}Development Mode{{/a}} via the JETPACK_DEV_DEBUG constant.{{br/}}Some features are disabled.',
					{
						components: {
							a: <a href="https://jetpack.com/support/development-mode/" target="_blank"/>,
							br: <br />
						}
					}
				);
			} else if ( devMode.url ) {
				text = __('Currently in {{a}}Development Mode{{/a}} because your site URL lacks a dot (e.g. http://localhost).{{br/}}Some features are disabled.',
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

export const UserUnlinked = React.createClass( {
	displayName: 'UserUnlinked',

	render() {
		console.log( this.props );
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
						href={ this.props.connectUrl }
					>
						{ __( 'Link to WordPress.com' ) }
					</NoticeAction>
				</SimpleNotice>
			);
		}

		return false;
	}

} );

const JetpackNotices = React.createClass( {
	displayName: 'JetpackNotices',

	render() {
		return (
			<div>
				<QueryConnectUrl />
				<NoticesList { ...this.props } />
				<JetpackStateNotices />
				<DevVersionNotice { ...this.props } />
				<DevModeNotice { ...this.props } />
				<StagingSiteNotice { ...this.props } />
				<DismissableNotices />
				<UserUnlinked
					connectUrl={ this.props.connectUrl( this.props ) }
					siteConnected={ true === getSiteConnectionStatus( this.props ) }
				/>
			</div>
		);
	}
} );

export default connect(
	state => {
		return {
			connectUrl: () => _getConnectUrl( state )
		};
	}
)( JetpackNotices );
