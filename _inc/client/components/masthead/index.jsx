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
} from 'state/connection';
import { getCurrentVersion, userCanEditPosts } from 'state/initial-state';
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
		const devNotice = this.props.siteConnectionStatus === 'dev' ? <code>Dev Mode</code> : '',
			sandboxedBadge = this.props.sandboxDomain ? (
				<code
					id="sandbox-domain-badge"
					onClick={ this.testConnection }
					onKeyDown={ this.testConnection }
					role="button"
					tabIndex={ 0 }
					title={ `Sandboxing via ${ this.props.sandboxDomain }. Click to test connection.` }
				>
					API Sandboxed
				</code>
			) : (
				''
			),
			isDashboardView = includes(
				[ '/', '/dashboard', '/my-plan', '/plans' ],
				this.props.location.pathname
			),
			isStatic = '' === this.props.location.pathname;

		const hideNav = this.props.location.pathname.startsWith( '/setup' );

		return (
			<div className="jp-masthead">
				<div className="jp-masthead__inside-container">
					<div className="jp-masthead__logo-container">
						<a onClick={ this.trackLogoClick } className="jp-masthead__logo-link" href="#dashboard">
							<JetpackLogo className="jetpack-logo__masthead" />
						</a>
						{ devNotice }
						{ sandboxedBadge }
					</div>
					{ this.props.userCanEditPosts && ! hideNav && (
						<div className="jp-masthead__nav">
							{ ! isStatic && this.props.siteConnectionStatus && (
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
			siteConnectionStatus: getSiteConnectionStatus( state ),
			sandboxDomain: getSandboxDomain( state ),
			currentVersion: getCurrentVersion( state ),
			userCanEditPosts: userCanEditPosts( state ),
		};
	},
	dispatch => {
		return {
			testConnection: () => dispatch( fetchSiteConnectionTest() ),
		};
	}
)( Masthead );
