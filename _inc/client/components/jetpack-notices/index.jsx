/**
 * External dependencies
 */
import PropTypes from 'prop-types';
import React from 'react';
import { connect } from 'react-redux';
import SimpleNotice from 'components/notice';
import NoticeAction from 'components/notice/notice-action.jsx';
import NoticeActionDisconnect from './notice-action-disconnect.jsx';
import { translate as __ } from 'i18n-calypso';
import NoticesList from 'components/global-notices';
import getRedirectUrl from 'lib/jp-redirect';

/**
 * Internal dependencies
 */
import JetpackStateNotices from './state-notices';
import {
	getSiteConnectionStatus,
	getSiteDevMode,
	isStaging,
	isInIdentityCrisis,
	isCurrentUserLinked,
	getConnectUrl as _getConnectUrl,
} from 'state/connection';
import { isDevVersion, userCanConnectSite, userIsSubscriber } from 'state/initial-state';
import DismissableNotices from './dismissable';
import JetpackBanner from 'components/jetpack-banner';
import { JETPACK_CONTACT_BETA_SUPPORT } from 'constants/urls';
import PlanConflictWarning from './plan-conflict-warning';

export class DevVersionNotice extends React.Component {
	static displayName = 'DevVersionNotice';

	render() {
		if ( this.props.isDevVersion && ! this.props.userIsSubscriber ) {
			return (
				<SimpleNotice
					showDismiss={ false }
					text={ __( 'You are currently running a development version of Jetpack.' ) }
				>
					<NoticeAction href={ JETPACK_CONTACT_BETA_SUPPORT }>
						{ __( 'Submit Beta feedback' ) }
					</NoticeAction>
				</SimpleNotice>
			);
		}

		return false;
	}
}

DevVersionNotice.propTypes = {
	isDevVersion: PropTypes.bool.isRequired,
	userIsSubscriber: PropTypes.bool.isRequired,
};

export class StagingSiteNotice extends React.Component {
	static displayName = 'StagingSiteNotice';

	render() {
		if ( this.props.isStaging && ! this.props.isInIdentityCrisis ) {
			const stagingSiteSupportLink = getRedirectUrl( 'jetpack-support-staging-sites' ),
				props = {
					text: __( 'You are running Jetpack on a staging server.' ),
					status: 'is-basic',
					showDismiss: false,
				};

			return (
				<SimpleNotice { ...props }>
					<NoticeAction href={ stagingSiteSupportLink }>{ __( 'More Info' ) }</NoticeAction>
				</SimpleNotice>
			);
		}

		return false;
	}
}

StagingSiteNotice.propTypes = {
	isStaging: PropTypes.bool.isRequired,
	isInIdentityCrisis: PropTypes.bool.isRequired,
};

export class DevModeNotice extends React.Component {
	static displayName = 'DevModeNotice';

	render() {
		if ( this.props.siteConnectionStatus === 'dev' ) {
			const devMode = this.props.siteDevMode,
				reasons = [];

			if ( devMode.filter ) {
				reasons.push(
					__( '{{li}}The jetpack_development_mode filter is active{{/li}}', {
						components: {
							li: <li />,
						},
					} )
				);
			}
			if ( devMode.constant ) {
				reasons.push(
					__( '{{li}}The JETPACK_DEV_DEBUG constant is defined{{/li}}', {
						components: {
							li: <li />,
						},
					} )
				);
			}
			if ( devMode.url ) {
				reasons.push(
					__( '{{li}}Your site URL lacks a dot (e.g. http://localhost){{/li}}', {
						components: {
							li: <li />,
						},
					} )
				);
			}

			const text = __(
				'Currently in {{a}}Development Mode{{/a}} (some features are disabled) because: {{reasons/}}',
				{
					components: {
						a: (
							<a
								href={ getRedirectUrl( 'jetpack-support-development-mode' ) }
								target="_blank"
								rel="noopener noreferrer"
							/>
						),
						reasons: <ul>{ reasons }</ul>,
					},
				}
			);

			return (
				<SimpleNotice showDismiss={ false } status="is-info" text={ text }>
					<NoticeAction href={ getRedirectUrl( 'jetpack-support-development-mode' ) }>
						{ __( 'Learn More' ) }
					</NoticeAction>
				</SimpleNotice>
			);
		}

		return false;
	}
}

DevModeNotice.propTypes = {
	siteConnectionStatus: PropTypes.oneOfType( [ PropTypes.string, PropTypes.bool ] ).isRequired,
	siteDevMode: PropTypes.oneOfType( [ PropTypes.bool, PropTypes.object ] ).isRequired,
};

export class UserUnlinked extends React.Component {
	static displayName = 'UserUnlinked';

	render() {
		if ( ! this.props.isLinked && this.props.connectUrl && this.props.siteConnected ) {
			return (
				<div className="jp-unlinked-notice">
					<JetpackBanner
						title={ __(
							'Jetpack is powering your site, but to access all of its features you’ll need to create an account.'
						) }
						callToAction={ __( 'Create account' ) }
						href={ `${ this.props.connectUrl }&from=unlinked-user-connect` }
						icon="my-sites"
						className="is-jetpack-info"
					/>
				</div>
			);
		}

		return false;
	}
}

UserUnlinked.propTypes = {
	connectUrl: PropTypes.string.isRequired,
	siteConnected: PropTypes.bool.isRequired,
};

export class ErrorNoticeCycleConnection extends React.Component {
	static propTypes = {
		text: PropTypes.string.isRequired,
	};

	render() {
		return (
			<SimpleNotice
				showDismiss={ false }
				text={ this.props.text }
				status={ 'is-error' }
				icon={ 'link-break' }
			>
				<NoticeActionDisconnect>{ __( 'Reconnect' ) }</NoticeActionDisconnect>
			</SimpleNotice>
		);
	}
}

class JetpackNotices extends React.Component {
	static displayName = 'JetpackNotices';

	render() {
		return (
			<div aria-live="polite">
				<NoticesList />
				<JetpackStateNotices />
				<DevVersionNotice
					isDevVersion={ this.props.isDevVersion }
					userIsSubscriber={ this.props.userIsSubscriber }
				/>
				<DevModeNotice
					siteConnectionStatus={ this.props.siteConnectionStatus }
					siteDevMode={ this.props.siteDevMode }
				/>
				<StagingSiteNotice
					isStaging={ this.props.isStaging }
					isInIdentityCrisis={ this.props.isInIdentityCrisis }
				/>
				<PlanConflictWarning />
				<DismissableNotices />
				<UserUnlinked
					connectUrl={ this.props.connectUrl }
					siteConnected={ true === this.props.siteConnectionStatus }
					isLinked={ this.props.isLinked }
				/>
				{ ! this.props.siteConnectionStatus && ! this.props.userCanConnectSite && (
					<SimpleNotice
						showDismiss={ false }
						status="is-warning"
						text={ __(
							'This site is not connected to WordPress.com. Please ask the site administrator to connect.'
						) }
					/>
				) }
			</div>
		);
	}
}

export default connect( state => {
	return {
		connectUrl: _getConnectUrl( state ),
		siteConnectionStatus: getSiteConnectionStatus( state ),
		userCanConnectSite: userCanConnectSite( state ),
		userIsSubscriber: userIsSubscriber( state ),
		isLinked: isCurrentUserLinked( state ),
		isDevVersion: isDevVersion( state ),
		siteDevMode: getSiteDevMode( state ),
		isStaging: isStaging( state ),
		isInIdentityCrisis: isInIdentityCrisis( state ),
	};
} )( JetpackNotices );
