import { JetpackLogo } from '@automattic/jetpack-components';
import { isWoASite } from '@automattic/jetpack-script-data';
import { Component } from 'react';
import { connect } from 'react-redux';
import analytics from 'lib/analytics';
import {
	getSiteConnectionStatus,
	getSandboxDomain,
	fetchSiteConnectionTest,
} from 'state/connection';
import { HeaderNav } from './header-nav';

export class Masthead extends Component {
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
					// eslint-disable-next-line jsx-a11y/no-noninteractive-element-to-interactive-role
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
							<JetpackLogo className="jetpack-logo__masthead" height={ 40 } />
						</a>
						{ offlineNotice }
						{ sandboxedBadge }
					</div>
					{ isWoASite() && <HeaderNav location={ this.props.location } /> }
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
