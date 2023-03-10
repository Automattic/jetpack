import { JetpackLogo } from '@automattic/jetpack-components';
import analytics from 'lib/analytics';
import React from 'react';
import { connect } from 'react-redux';
import {
	getSiteConnectionStatus,
	getSandboxDomain,
	fetchSiteConnectionTest,
} from 'state/connection';
import { isWoASite as getIsWoASite } from 'state/initial-state';
import { HeaderNav } from './header-nav';

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
		const { isWoASite, sandboxDomain, siteConnectionStatus } = this.props;

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
					{ isWoASite && <HeaderNav location={ this.props.location } /> }
				</div>
			</div>
		);
	}
}

export default connect(
	state => {
		return {
			isWoASite: getIsWoASite( state ),
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
