/**
 * External dependencies
 */
import React from 'react';
import { connect } from 'react-redux';
import { JetpackLogo } from '@automattic/jetpack-components';

/**
 * Internal dependencies
 */
import analytics from 'lib/analytics';
import { HeaderNav } from './header-nav';
import {
	getSiteConnectionStatus,
	getSandboxDomain,
	fetchSiteConnectionTest,
} from 'state/connection';

export class Masthead extends React.Component {
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
		const { sandboxDomain, siteConnectionStatus } = this.props;

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
			);

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
					<HeaderNav location={ this.props.location } />
				</div>
			</div>
		);
	}
}

export default connect(
	state => {
		return {
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
