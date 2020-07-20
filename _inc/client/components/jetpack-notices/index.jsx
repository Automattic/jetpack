/**
 * External dependencies
 */
import PropTypes from 'prop-types';
import React from 'react';
import { connect } from 'react-redux';
import { jetpackCreateInterpolateElement } from 'components/create-interpolate-element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import ConnectionBanner from 'components/connection-banner';
import DismissableNotices from './dismissable';
import getRedirectUrl from 'lib/jp-redirect';
import {
	getSiteConnectionStatus,
	getSiteDevMode,
	isStaging,
	isInIdentityCrisis,
	isCurrentUserLinked,
	getConnectUrl as _getConnectUrl,
} from 'state/connection';
import {
	isDevVersion,
	userCanConnectSite,
	userIsSubscriber,
	getConnectionErrors,
} from 'state/initial-state';
import { getSiteDataErrors } from 'state/site';
import { JETPACK_CONTACT_BETA_SUPPORT } from 'constants/urls';
import JetpackStateNotices from './state-notices';
import JetpackConnectionErrors from './jetpack-connection-errors';
import NoticeAction from 'components/notice/notice-action.jsx';
import NoticesList from 'components/global-notices';
import PlanConflictWarning from './plan-conflict-warning';
import SimpleNotice from 'components/notice';

export class DevVersionNotice extends React.Component {
	static displayName = 'DevVersionNotice';

	render() {
		if ( this.props.isDevVersion && ! this.props.userIsSubscriber ) {
			return (
				<SimpleNotice
					showDismiss={ false }
					text={ __( 'You are currently running a development version of Jetpack.', 'jetpack' ) }
				>
					<NoticeAction href={ JETPACK_CONTACT_BETA_SUPPORT }>
						{ __( 'Submit Beta feedback', 'jetpack' ) }
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
					text: __( 'You are running Jetpack on a staging server.', 'jetpack' ),
					status: 'is-basic',
					showDismiss: false,
				};

			return (
				<SimpleNotice { ...props }>
					<NoticeAction href={ stagingSiteSupportLink }>
						{ __( 'More Info', 'jetpack' ) }
					</NoticeAction>
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
				reasons.push( __( 'The jetpack_development_mode filter is active', 'jetpack' ) );
			}
			if ( devMode.constant ) {
				reasons.push( __( 'The JETPACK_DEV_DEBUG constant is defined', 'jetpack' ) );
			}
			if ( devMode.url ) {
				reasons.push( __( 'Your site URL lacks a dot (e.g. http://localhost)', 'jetpack' ) );
			}

			const text = jetpackCreateInterpolateElement(
				/* translators: reasons is an unordered list of reasons why a site may be in Development mode. */
				__(
					'Currently in <a>Development Mode</a> (some features are disabled) because: <reasons/>',
					'jetpack'
				),
				{
					a: (
						<a
							href={ getRedirectUrl( 'jetpack-support-development-mode' ) }
							target="_blank"
							rel="noopener noreferrer"
						/>
					),
					reasons: (
						<ul>
							{ reasons.map( ( reason, i ) => {
								return <li key={ i }>{ reason }</li>;
							} ) }
						</ul>
					),
				}
			);

			return (
				<SimpleNotice showDismiss={ false } status="is-info" text={ text }>
					<NoticeAction href={ getRedirectUrl( 'jetpack-support-development-mode' ) }>
						{ __( 'Learn More', 'jetpack' ) }
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
					<ConnectionBanner
						title={ __(
							'Jetpack is powering your site, but to access all of its features you’ll need to connect your account to WordPress.com.',
							'jetpack'
						) }
						callToAction={ __( 'Create account', 'jetpack' ) }
						href={ `${ this.props.connectUrl }&from=unlinked-user-connect` }
						icon="my-sites"
						className="is-jetpack-info"
						from="unlinked-user-connect"
						connectUser={ true }
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

class JetpackNotices extends React.Component {
	static displayName = 'JetpackNotices';

	render() {
		const siteDataErrors = this.props.siteDataErrors.filter( error =>
			error.hasOwnProperty( 'action' )
		);

		return (
			<div aria-live="polite">
				<NoticesList />
				{ this.props.siteConnectionStatus &&
					this.props.userCanConnectSite &&
					( this.props.connectionErrors.length > 0 || siteDataErrors.length > 0 ) && (
						<JetpackConnectionErrors
							errors={ this.props.connectionErrors.concat( siteDataErrors ) }
						/>
					) }
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
							'This site is not connected to WordPress.com. Please ask the site administrator to connect.',
							'jetpack'
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
		connectionErrors: getConnectionErrors( state ),
		siteDataErrors: getSiteDataErrors( state ),
	};
} )( JetpackNotices );
