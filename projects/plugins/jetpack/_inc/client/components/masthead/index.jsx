/**
 * External dependencies
 */
import React from 'react';
import { connect } from 'react-redux';
import { includes } from 'lodash';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import analytics from 'lib/analytics';
import Button from 'components/button';
import ButtonGroup from 'components/button-group';
import {
	getSiteConnectionStatus,
	getSandboxDomain,
	fetchSiteConnectionTest,
	hasConnectedOwner as hasConnectedOwnerSelector,
	isSiteRegistered,
} from 'state/connection';
import { getCurrentVersion, userCanEditPosts, userCanManageOptions } from 'state/initial-state';
import JetpackLogo from '../jetpack-logo';

export class Masthead extends React.Component {
	static defaultProps = {
		location: { pathname: '' },
	};

	trackDashClick = () => {
		analytics.tracks.recordJetpackClick( {
			target: 'masthead',
			path: 'nav_dashboard',
		} );
	};

	trackSettingsClick = () => {
		analytics.tracks.recordJetpackClick( {
			target: 'masthead',
			path: 'nav_settings',
		} );
	};

	trackLogoClick = () => {
		analytics.tracks.recordJetpackClick( {
			target: 'masthead',
			path: 'logo',
		} );
	};

	testConnection = () => {
		return this.props.testConnection();
	};

	render() {
		const {
			canEditPosts,
			canManageOptions,
			hasConnectedOwner,
			isSiteConnected,
			location: { pathname },
			sandboxDomain,
			siteConnectionStatus,
		} = this.props;

		const offlineNotice = siteConnectionStatus === 'offline' ? <code>Offline Mode</code> : '',
			sandboxedBadge = sandboxDomain ? (
				<code
					id="sandbox-domain-badge"
					onClick={ this.testConnection }
					onKeyDown={ this.testConnection }
					role="button"
					tabIndex={ 0 }
					title={ `Sandboxing via ${ sandboxDomain }. Click to test connection.` }
				>
					API Sandboxed
				</code>
			) : (
				''
			),
			isDashboardView =
				includes( [ '/', '/dashboard', '/my-plan', '/plans' ], pathname ) ||
				pathname.includes( '/recommendations' ),
			isStatic = '' === pathname;

		/*
		 * Determine whether a user can access the Jetpack Settings page.
		 *
		 * Rules are:
		 * - We're not on the /setup page route
		 * - user is allowed to see the Jetpack Admin
		 * - site is connected or in offline mode
		 * - if the site is connected but doesn't have a connected user, only show to admins.
		 */
		const canAccessSettings =
			! pathname.startsWith( '/setup' ) &&
			canEditPosts &&
			( siteConnectionStatus === 'offline' ||
				( isSiteConnected && hasConnectedOwner ) ||
				( isSiteConnected && ! hasConnectedOwner && canManageOptions ) );

		return (
			<div className="jp-masthead">
				<div className="jp-masthead__inside-container">
					<div className="jp-masthead__logo-container">
						<a onClick={ this.trackLogoClick } className="jp-masthead__logo-link" href="#dashboard">
							<JetpackLogo className="jetpack-logo__masthead" />
						</a>
						{ offlineNotice }
						{ sandboxedBadge }
					</div>
					{ canAccessSettings && (
						<div className="jp-masthead__nav">
							{ ! isStatic && siteConnectionStatus && (
								<ButtonGroup>
									<Button
										compact={ true }
										href="#/dashboard"
										primary={ isDashboardView && ! isStatic }
										onClick={ this.trackDashClick }
									>
										{ __( 'Dashboard', 'jetpack' ) }
									</Button>
									<Button
										compact={ true }
										href="#/settings"
										primary={ ! isDashboardView && ! isStatic }
										onClick={ this.trackSettingsClick }
									>
										{ __( 'Settings', 'jetpack' ) }
									</Button>
								</ButtonGroup>
							) }
						</div>
					) }
				</div>
			</div>
		);
	}
}

export default connect(
	state => {
		return {
			canEditPosts: userCanEditPosts( state ),
			canManageOptions: userCanManageOptions( state ),
			currentVersion: getCurrentVersion( state ),
			hasConnectedOwner: hasConnectedOwnerSelector( state ),
			isSiteConnected: isSiteRegistered( state ),
			sandboxDomain: getSandboxDomain( state ),
			siteConnectionStatus: getSiteConnectionStatus( state ),
		};
	},
	dispatch => {
		return {
			testConnection: () => dispatch( fetchSiteConnectionTest() ),
		};
	}
)( Masthead );
